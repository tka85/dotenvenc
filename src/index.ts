// import Debug from 'debug';
import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import dotenv, { DotenvParseOutput } from 'dotenv';
import prompts from 'prompts';

// const debug = Debug('dotenvenc');

export const DEFAULT_ENCRYPTED_FILE = './.env.enc';
export const DEFAULT_ENCRYPTED_FILE_READABLE = './.env.enc.readable';
export const DEFAULT_DECRYPTED_FILE = './.env';
const ALGOR = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended nonce size for GCM (NIST SP 800-38D)
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // key used in createCipheriv()/createDecipheriv() buffer needs to be 32 bytes
// scrypt cost parameters. They are NOT recorded in the encrypted file, so raising
// them invalidates every file encrypted with the previous values.
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const HEX_RE = /^[0-9a-f]*$/i;

export type decryptParams = {
    passwd?: string, // default is process.env.DOTENVENC_PASS
    encryptedFile?: string, // default is ./.env.enc
    print?: boolean,
    silent?: boolean,
};

export type encryptParams = {
    passwd: string, // default is process.env.DOTENVENC_PASS
    decryptedFile?: string, // default is ./.env
    encryptedFile?: string, // default is ./.env.enc
    includeReadable?: boolean, // default is false
    silent?: boolean,
};

export function log({ data, silent }: { data: string, silent?: boolean }): void {
    if (!silent) {
        console.log(data);
    }
}

/**
 * Stretch the password into the 32 byte key that createCipheriv()/createDecipheriv() require.
 * scrypt is deliberately slow and memory-hard, so guessing the password costs an
 * attacker far more than a bare AES call. The salt makes every file's key unique,
 * so work cannot be shared across files or precomputed.
 * @param     {String}    passwd     the user supplied password
 * @param     {Buffer}    saltBuff   the per-file random salt
 * @returns   {Buffer}               the derived 32 byte key
 */
function deriveKey(passwd: string, saltBuff: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(passwd, saltBuff, KEY_LENGTH, SCRYPT_PARAMS, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(derivedKey);
            }
        });
    });
}

/**
 * Decode a hex field of the encrypted file, rejecting non-hex text and wrong lengths.
 * Buffer.from(x, 'hex') silently drops invalid characters, so it cannot be trusted on its own.
 */
function decodeHexField(hexText: string, fieldName: string, encryptedFile: string, expectedBytes?: number): Buffer {
    if (!HEX_RE.test(hexText)) {
        throw new Error(`Malformed encrypted secrets file "${encryptedFile}": ${fieldName} is not valid hex`);
    }
    const buff = Buffer.from(hexText, 'hex');
    if (expectedBytes !== undefined && buff.length !== expectedBytes) {
        throw new Error(`Malformed encrypted secrets file "${encryptedFile}": ${fieldName} must be ${expectedBytes} bytes but is ${buff.length}`);
    }
    return buff;
}

/**
 * Read, authenticate and decrypt an encrypted secrets file.
 * Throws if the file is missing or malformed, or if the password is wrong or the contents were tampered with.
 * @param     {String}    encryptedFile   the full path of the encrypted file
 * @param     {String}    passwd          the password the file was encrypted with
 * @returns   {Object}                    the config object as it's parsed by dotenv
 */
async function decryptFile(encryptedFile: string, passwd: string): Promise<DotenvParseOutput> {
    if (!existsSync(encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${encryptedFile}" not found`);
    }
    const fields = readFileSync(encryptedFile).toString().trim().split(':');
    if (fields.length !== 4) {
        throw new Error(`Malformed encrypted secrets file "${encryptedFile}": expected "<salt>:<iv>:<authTag>:<ciphertext>" but found ${fields.length} ":"-separated field(s). Files produced by dotenvenc <= 5.x use an older unauthenticated, unsalted format and have to be re-encrypted.`);
    }
    const [saltText, ivText, authTagText, encText] = fields;
    const saltBuff = decodeHexField(saltText, 'salt', encryptedFile, SALT_LENGTH);
    const ivBuff = decodeHexField(ivText, 'initialization vector', encryptedFile, IV_LENGTH);
    const authTagBuff = decodeHexField(authTagText, 'authentication tag', encryptedFile, AUTH_TAG_LENGTH);
    const encrBuff = decodeHexField(encText, 'ciphertext', encryptedFile);
    const decipher = crypto.createDecipheriv(ALGOR, await deriveKey(passwd, saltBuff), ivBuff);
    decipher.setAuthTag(authTagBuff);
    let decrBuff: Buffer;
    try {
        decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    } catch {
        // GCM authentication failed: the key is wrong or the ciphertext/tag was modified
        throw new Error(`Failed to decrypt "${encryptedFile}": wrong password, or the file has been tampered with or corrupted`);
    }
    const parsedEnv = dotenv.parse(decrBuff);
    if (Object.keys(parsedEnv).length === 0) {
        throw new Error(`Restored no env variables from "${encryptedFile}"; the encrypted file is empty`);
    }
    return parsedEnv;
}

/**
 * Read encrypted env file and either print it on console or populate process.env from it
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @param     {Boolean}   [print]           whether to print result on console
 * @returns   {Object}                      the config object as it's parsed by dotenv
 */
export async function decrypt(params?: decryptParams): Promise<{ [key: string]: string }> {
    let passwd = params && params.passwd;
    const silent = params && params.silent || false;
    // if passed params.print=true we don't want to print anything else besides the `export VAR=VAL` lines
    let logOutput = '';
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            log({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(false, silent);
        } else {
            logOutput += '# Decrypted using env variable DOTENVENC_PASS';
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || DEFAULT_ENCRYPTED_FILE;
    const parsedEnv = await decryptFile(encryptedFile, passwd);
    Object.assign(process.env, parsedEnv);
    if (params && params.print) {
        for (const prop in parsedEnv) {
            if (parsedEnv.hasOwnProperty(prop)) {
                log({ data: `${prop}=${parsedEnv[prop].replace(/"/g, '\\"')}` });
            }
        }
    } else if (logOutput) {
        log({ data: logOutput, silent });
    }
    return parsedEnv;
}

/**
 * Read encrypted env file and print on console "export" statements for the env vars
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {void}
 */
export async function printExport(params?: decryptParams): Promise<void> {
    let passwd = params && params.passwd;
    const silent = params && params.silent || false;
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            passwd = await promptPassword(false, silent);
        } else {
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || DEFAULT_ENCRYPTED_FILE;
    const parsedEnv = await decryptFile(encryptedFile, passwd);
    Object.assign(process.env, parsedEnv);
    for (const prop in parsedEnv) {
        if (parsedEnv.hasOwnProperty(prop)) {
            log({ data: `export ${prop}="${parsedEnv[prop].replace(/"/g, '\\"')}";` });
        }
    }
}

/**
 * Write to disk encrypted env secrets file from decrypted env secrets file
 * @param     {String}    [passwd]           the password for encrypting the .env into .env.enc
 * @param     {String}    [decryptedFile]    the full path of decrypted file or DEFAULT_DECRYPTED_PATHNAME if ommitted
 * @param     {String}    [encryptedFile]    the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {Buffer}                       returns Buffer with encrypted data [regardless of whether it persisted it on disk or not]
 */
export async function encrypt(params?: encryptParams): Promise<Buffer> {
    let passwd = params && params.passwd;
    const silent = params && params.silent || false;
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            log({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(true, silent);
        } else {
            log({ data: '# Encrypting using env variable DOTENVENC_PASS', silent });
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const decryptedFilename = (params && params.decryptedFile) || DEFAULT_DECRYPTED_FILE;
    const encryptedFilename = (params && params.encryptedFile) || DEFAULT_ENCRYPTED_FILE;
    if (!existsSync(decryptedFilename)) {
        throw new Error(`Decrypted secrets input file "${decryptedFilename}" not found`);
    }
    if (existsSync(encryptedFilename)) {
        log({ data: `# WARNING: encrypted secrets output file "${encryptedFilename}" already exists; overwriting...`, silent });
    }
    const decryptedEnvContentsBuff = readFileSync(decryptedFilename);
    const parsedEnvContents = dotenv.parse(decryptedEnvContentsBuff);
    const saltBuff = crypto.randomBytes(SALT_LENGTH);
    const ivBuff = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGOR, await deriveKey(passwd, saltBuff), ivBuff);
    const encrBuff = Buffer.concat([cipher.update(decryptedEnvContentsBuff), cipher.final()]);
    const authTagBuff = cipher.getAuthTag();
    writeFileSync(encryptedFilename, [saltBuff.toString('hex'), ivBuff.toString('hex'), authTagBuff.toString('hex'), encrBuff.toString('hex')].join(':'));
    if (params?.includeReadable === true) {
        encryptValuesOnly(encryptedFilename, passwd, parsedEnvContents);
    }
    return encrBuff;
}

export function encryptValuesOnly(encryptedFilename: string, passwd: string, parsedEnvContents: DotenvParseOutput): void {
    const encryptedValuesOnlyFilename = `${encryptedFilename}.readable`;
    const encryptedValuesOnly = {};
    Object.entries(parsedEnvContents).forEach(([varName, value]) => {
        const encrValueHex = crypto.createHmac('sha256', passwd)
            .update(value)
            .digest('hex');
        encryptedValuesOnly[varName] = encrValueHex;
    });
    writeFileSync(encryptedValuesOnlyFilename, JSON.stringify(encryptedValuesOnly, null, 2));
}

export async function promptPassword(askConfirmation: boolean, silent: boolean): Promise<string> {
    const { passwd } = await prompts({
        type: 'password',
        name: 'passwd',
        message: silent ? '' : 'Type password:'
    });
    if (askConfirmation) {
        const { confirmPasswd } = await prompts({
            type: 'password',
            name: 'confirmPasswd',
            message: silent ? '' : 'Confirm password:'
        });
        if (passwd !== confirmPasswd) {
            throw new Error('Password did not match. Exiting.');
        }
    }
    return passwd;
}
