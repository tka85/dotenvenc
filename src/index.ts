// import Debug from 'debug';
import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import prompts from 'prompts';

// const debug = Debug('dotenvenc');

export const DEFAULT_ENCRYPTED_FILE = './.env.enc';
export const DEFAULT_DECRYPTED_FILE = './.env';
const ALGOR = 'aes-256-ctr';
const IV_LENGTH = 16;
const MAX_KEY_LENGTH = 32;
const BUFFER_PADDING = Buffer.alloc(MAX_KEY_LENGTH); // key used in createCipheriv()/createDecipheriv() buffer needs to be 32 bytes

export type decryptParams = {
    passwd?: string, // default is process.env.DOTENVENC_PASS
    encryptedFile?: string, // default is ./.env.enc
    print?: boolean
};

export type encryptParams = {
    passwd: string, // default is process.env.DOTENVENC_PASS
    decryptedFile?: string, // default is ./.env
    encryptedFile?: string, // default is ./.env.enc
};

/**
 * Read encrypted env file and either print it on console or populate process.env from it
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @param     {Boolean}   [print]           whether to print result on console
 * @returns   {Object}                      the config object as it's parsed by dotenv
 */
export async function decrypt(params?: decryptParams): Promise<{ [key: string]: string }> {
    let passwd = params && params.passwd;
    // if passed params.print=true we don't want to print anything else besides the `export VAR=VAL` lines
    let logOutput = '';
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            passwd = await promptPassword(false);
        } else {
            logOutput += '# Decrypted using env variable DOTENVENC_PASS';
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || DEFAULT_ENCRYPTED_FILE;
    if (params && params.encryptedFile && !existsSync(params.encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${params.encryptedFile}" not found`);
    }
    const allEncrData = readFileSync(encryptedFile);
    const [ivText, encText] = allEncrData.toString().split(':');
    const ivBuff = Buffer.from(ivText, 'hex');
    const encrBuff = Buffer.from(encText, 'hex');
    const decipher = crypto.createDecipheriv(ALGOR, Buffer.concat([Buffer.from(passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    const parsedEnv = dotenv.parse(decrBuff);
    Object.assign(process.env, parsedEnv);
    // Wrong passwd => empty list of env vars
    if (JSON.stringify(parsedEnv) === '{}') {
        throw new Error('Restored no env variables. Either empty input file or wrong password.');
    }
    if (params && params.print) {
        for (const prop in parsedEnv) {
            if (parsedEnv.hasOwnProperty(prop)) {
                console.log(`${prop}=${parsedEnv[prop].replace(/"/g, '\\"')}`);
            }
        }
    } else if (logOutput) {
        console.log(logOutput);
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
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            passwd = await promptPassword(false);
        } else {
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || DEFAULT_ENCRYPTED_FILE;
    if (params && params.encryptedFile && !existsSync(params.encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${params.encryptedFile}" not found`);
    }
    const allEncrData = readFileSync(encryptedFile);
    const [ivText, encText] = allEncrData.toString().split(':');
    const ivBuff = Buffer.from(ivText, 'hex');
    const encrBuff = Buffer.from(encText, 'hex');
    const decipher = crypto.createDecipheriv(ALGOR, Buffer.concat([Buffer.from(passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    const parsedEnv = dotenv.parse(decrBuff);
    Object.assign(process.env, parsedEnv);
    // Wrong passwd => empty list of env vars
    if (JSON.stringify(parsedEnv) === '{}') {
        throw new Error('Restored no env variables. Either empty input file or wrong password.');
    }
    for (const prop in parsedEnv) {
        if (parsedEnv.hasOwnProperty(prop)) {
            console.log(`export ${prop}="${parsedEnv[prop].replace(/"/g, '\\"')}";`);
        }
    }
}

/**
 * Write to disk encrypted env secrets file from decrypted env secrets file
 * @param     {String}    passwd             the password for encrypting the .env into .env.enc
 * @param     {String}    [decryptedFile]    the full path of decrypted file or DEFAULT_DECRYPTED_PATHNAME if ommitted
 * @param     {String}    [encryptedFile]    the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {Buffer}                       returns Buffer with encrypted data [regardless of whether it persisted it on disk or not]
 */
export async function encrypt(params?: encryptParams): Promise<Buffer> {
    let passwd = params && params.passwd;
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            console.log('# No env variable DOTENVENC_PASS found; prompting for encryption password');
            passwd = await promptPassword(true);
        } else {
            console.log('# Encrypting using env variable DOTENVENC_PASS');
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const decryptedFile = (params && params.decryptedFile) || DEFAULT_DECRYPTED_FILE;
    const encryptedFile = (params && params.encryptedFile) || DEFAULT_ENCRYPTED_FILE;
    if (!existsSync(decryptedFile)) {
        throw new Error(`Dencrypted secrets input file "${decryptedFile}" not found`);
    }
    if (existsSync(encryptedFile)) {
        console.log(`# Encrypted secrets output file "${encryptedFile}" already exists; overwriting...`);
    }
    const ivBuff = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGOR, Buffer.concat([Buffer.from(passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const encrBuff = Buffer.concat([cipher.update(readFileSync(decryptedFile)), cipher.final()]);
    writeFileSync(encryptedFile, ivBuff.toString('hex') + ':' + encrBuff.toString('hex'));
    return encrBuff;
}

export async function promptPassword(askConfirmation: boolean): Promise<string> {
    const { passwd } = await prompts({
        type: 'password',
        name: 'passwd',
        message: 'Type password:'
    });
    if (askConfirmation) {
        const { confirmPasswd } = await prompts({
            type: 'password',
            name: 'confirmPasswd',
            message: 'Confirm password:'
        });
        if (passwd !== confirmPasswd) {
            throw new Error('Password did not match. Exiting.');
        }
    }
    return passwd;
}

