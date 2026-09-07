"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptPassword = exports.encryptValuesOnly = exports.encrypt = exports.printExport = exports.decrypt = exports.log = exports.CURRENT_FORMAT_VERSION = exports.DEFAULT_DECRYPTED_FILE = exports.DEFAULT_ENCRYPTED_FILE_READABLE = exports.DEFAULT_ENCRYPTED_FILE = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = require("fs");
const dotenv_1 = __importDefault(require("dotenv"));
const prompts_1 = __importDefault(require("prompts"));
exports.DEFAULT_ENCRYPTED_FILE = './.env.enc';
exports.DEFAULT_ENCRYPTED_FILE_READABLE = './.env.enc.readable';
exports.DEFAULT_DECRYPTED_FILE = './.env';
const KEY_LENGTH = 32; // key used in createCipheriv()/createDecipheriv() buffer needs to be 32 bytes
const HEX_RE = /^[0-9a-f]*$/i;
const VERSION_RE = /^v[0-9]+$/;
/**
 * Every encrypted file starts with the version tag of the parameter set it was written
 * with, so cost parameters can be raised by adding an entry here and pointing
 * CURRENT_FORMAT_VERSION at it. Old files keep decrypting; only new files use the new
 * parameters. Never edit a published entry, that would orphan every file using it.
 */
const FORMATS = {
    v2: {
        algorithm: 'aes-256-gcm',
        ivLength: 12,
        authTagLength: 16,
        saltLength: 16,
        scrypt: { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    },
};
exports.CURRENT_FORMAT_VERSION = 'v2';
function log({ data, silent }) {
    if (!silent) {
        console.log(data);
    }
}
exports.log = log;
/**
 * Stretch the password into the 32 byte key that createCipheriv()/createDecipheriv() require.
 * scrypt is deliberately slow and memory-hard, so guessing the password costs an
 * attacker far more than a bare AES call. The salt makes every file's key unique,
 * so work cannot be shared across files or precomputed.
 * @param     {String}    passwd     the user supplied password
 * @param     {Buffer}    saltBuff   the per-file random salt
 * @param     {Object}    format     the cost parameters recorded in the file's version tag
 * @returns   {Buffer}               the derived 32 byte key
 */
function deriveKey(passwd, saltBuff, format) {
    return new Promise((resolve, reject) => {
        crypto_1.default.scrypt(passwd, saltBuff, KEY_LENGTH, format.scrypt, (err, derivedKey) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(derivedKey);
            }
        });
    });
}
/**
 * Decode a hex field of the encrypted file, rejecting non-hex text and wrong lengths.
 * Buffer.from(x, 'hex') silently drops invalid characters, so it cannot be trusted on its own.
 */
function decodeHexField(hexText, fieldName, encryptedFile, expectedBytes) {
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
async function decryptFile(encryptedFile, passwd) {
    if (!(0, fs_1.existsSync)(encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${encryptedFile}" not found`);
    }
    const fields = (0, fs_1.readFileSync)(encryptedFile).toString().trim().split(':');
    const version = fields[0];
    if (!FORMATS[version]) {
        if (VERSION_RE.test(version)) {
            throw new Error(`Encrypted secrets file "${encryptedFile}" declares format "${version}", which this version of dotenvenc cannot read. Upgrade dotenvenc.`);
        }
        throw new Error(`Unrecognized encrypted secrets file "${encryptedFile}": it does not start with a format version tag. Files produced by dotenvenc <= 5.x used an unauthenticated, unsalted format and have to be re-encrypted with this version.`);
    }
    const format = FORMATS[version];
    if (fields.length !== 5) {
        throw new Error(`Malformed encrypted secrets file "${encryptedFile}": expected "${version}:<salt>:<iv>:<authTag>:<ciphertext>" but found ${fields.length} ":"-separated field(s)`);
    }
    const [, saltText, ivText, authTagText, encText] = fields;
    const saltBuff = decodeHexField(saltText, 'salt', encryptedFile, format.saltLength);
    const ivBuff = decodeHexField(ivText, 'initialization vector', encryptedFile, format.ivLength);
    const authTagBuff = decodeHexField(authTagText, 'authentication tag', encryptedFile, format.authTagLength);
    const encrBuff = decodeHexField(encText, 'ciphertext', encryptedFile);
    const decipher = crypto_1.default.createDecipheriv(format.algorithm, await deriveKey(passwd, saltBuff, format), ivBuff);
    decipher.setAuthTag(authTagBuff);
    let decrBuff;
    try {
        decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    }
    catch {
        // GCM authentication failed: the key is wrong or the ciphertext/tag was modified
        throw new Error(`Failed to decrypt "${encryptedFile}": wrong password, or the file has been tampered with or corrupted`);
    }
    const parsedEnv = dotenv_1.default.parse(decrBuff);
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
async function decrypt(params) {
    let passwd = params && params.passwd;
    const silent = params && params.silent || false;
    // if passed params.print=true we don't want to print anything else besides the `export VAR=VAL` lines
    let logOutput = '';
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            log({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(false, silent);
        }
        else {
            logOutput += '# Decrypted using env variable DOTENVENC_PASS';
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    const parsedEnv = await decryptFile(encryptedFile, passwd);
    Object.assign(process.env, parsedEnv);
    if (params && params.print) {
        for (const prop in parsedEnv) {
            if (parsedEnv.hasOwnProperty(prop)) {
                log({ data: `${prop}=${parsedEnv[prop].replace(/"/g, '\\"')}` });
            }
        }
    }
    else if (logOutput) {
        log({ data: logOutput, silent });
    }
    return parsedEnv;
}
exports.decrypt = decrypt;
/**
 * Read encrypted env file and print on console "export" statements for the env vars
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {void}
 */
async function printExport(params) {
    let passwd = params && params.passwd;
    const silent = params && params.silent || false;
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            passwd = await promptPassword(false, silent);
        }
        else {
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    const parsedEnv = await decryptFile(encryptedFile, passwd);
    Object.assign(process.env, parsedEnv);
    for (const prop in parsedEnv) {
        if (parsedEnv.hasOwnProperty(prop)) {
            log({ data: `export ${prop}="${parsedEnv[prop].replace(/"/g, '\\"')}";` });
        }
    }
}
exports.printExport = printExport;
/**
 * Write to disk encrypted env secrets file from decrypted env secrets file
 * @param     {String}    [passwd]           the password for encrypting the .env into .env.enc
 * @param     {String}    [decryptedFile]    the full path of decrypted file or DEFAULT_DECRYPTED_PATHNAME if ommitted
 * @param     {String}    [encryptedFile]    the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {Buffer}                       returns Buffer with encrypted data [regardless of whether it persisted it on disk or not]
 */
async function encrypt(params) {
    let passwd = params && params.passwd;
    const silent = params && params.silent || false;
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            log({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(true, silent);
        }
        else {
            log({ data: '# Encrypting using env variable DOTENVENC_PASS', silent });
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const decryptedFilename = (params && params.decryptedFile) || exports.DEFAULT_DECRYPTED_FILE;
    const encryptedFilename = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    if (!(0, fs_1.existsSync)(decryptedFilename)) {
        throw new Error(`Decrypted secrets input file "${decryptedFilename}" not found`);
    }
    if ((0, fs_1.existsSync)(encryptedFilename)) {
        log({ data: `# WARNING: encrypted secrets output file "${encryptedFilename}" already exists; overwriting...`, silent });
    }
    const decryptedEnvContentsBuff = (0, fs_1.readFileSync)(decryptedFilename);
    const parsedEnvContents = dotenv_1.default.parse(decryptedEnvContentsBuff);
    const format = FORMATS[exports.CURRENT_FORMAT_VERSION];
    const saltBuff = crypto_1.default.randomBytes(format.saltLength);
    const ivBuff = crypto_1.default.randomBytes(format.ivLength);
    const cipher = crypto_1.default.createCipheriv(format.algorithm, await deriveKey(passwd, saltBuff, format), ivBuff);
    const encrBuff = Buffer.concat([cipher.update(decryptedEnvContentsBuff), cipher.final()]);
    const authTagBuff = cipher.getAuthTag();
    (0, fs_1.writeFileSync)(encryptedFilename, [exports.CURRENT_FORMAT_VERSION, saltBuff.toString('hex'), ivBuff.toString('hex'), authTagBuff.toString('hex'), encrBuff.toString('hex')].join(':'));
    if (params?.includeReadable === true) {
        encryptValuesOnly(encryptedFilename, passwd, parsedEnvContents);
    }
    return encrBuff;
}
exports.encrypt = encrypt;
function encryptValuesOnly(encryptedFilename, passwd, parsedEnvContents) {
    const encryptedValuesOnlyFilename = `${encryptedFilename}.readable`;
    const encryptedValuesOnly = {};
    Object.entries(parsedEnvContents).forEach(([varName, value]) => {
        const encrValueHex = crypto_1.default.createHmac('sha256', passwd)
            .update(value)
            .digest('hex');
        encryptedValuesOnly[varName] = encrValueHex;
    });
    (0, fs_1.writeFileSync)(encryptedValuesOnlyFilename, JSON.stringify(encryptedValuesOnly, null, 2));
}
exports.encryptValuesOnly = encryptValuesOnly;
async function promptPassword(askConfirmation, silent) {
    const { passwd } = await (0, prompts_1.default)({
        type: 'password',
        name: 'passwd',
        message: silent ? '' : 'Type password:'
    });
    if (askConfirmation) {
        const { confirmPasswd } = await (0, prompts_1.default)({
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
exports.promptPassword = promptPassword;
//# sourceMappingURL=index.js.map