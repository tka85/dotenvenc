"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptPassword = exports.encryptValuesOnly = exports.encrypt = exports.printExport = exports.decrypt = exports.log = exports.DEFAULT_DECRYPTED_FILE = exports.DEFAULT_ENCRYPTED_FILE_READABLE = exports.DEFAULT_ENCRYPTED_FILE = void 0;
// import Debug from 'debug';
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = require("fs");
const dotenv_1 = __importDefault(require("dotenv"));
const prompts_1 = __importDefault(require("prompts"));
// const debug = Debug('dotenvenc');
exports.DEFAULT_ENCRYPTED_FILE = './.env.enc';
exports.DEFAULT_ENCRYPTED_FILE_READABLE = './.env.enc.readable';
exports.DEFAULT_DECRYPTED_FILE = './.env';
const ALGOR = 'aes-256-ctr';
const IV_LENGTH = 16;
const MAX_KEY_LENGTH = 32;
const BUFFER_PADDING = Buffer.alloc(MAX_KEY_LENGTH); // key used in createCipheriv()/createDecipheriv() buffer needs to be 32 bytes
function log({ data, silent }) {
    if (!silent) {
        console.log(data);
    }
}
exports.log = log;
/**
 * Read encrypted env file and either print it on console or populate process.env from it
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @param     {Boolean}   [print]           whether to print result on console
 * @returns   {Object}                      the config object as it's parsed by dotenv
 */
async function decrypt(params) {
    let passwd = params && params.passwd;
    const silent = params && params.silent;
    // if passed params.print=true we don't want to print anything else besides the `export VAR=VAL` lines
    let logOutput = '';
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            log({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(false);
        }
        else {
            logOutput += '# Decrypted using env variable DOTENVENC_PASS';
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    if (params && params.encryptedFile && !(0, fs_1.existsSync)(params.encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${params.encryptedFile}" not found`);
    }
    const allEncrData = (0, fs_1.readFileSync)(encryptedFile);
    const [ivText, encText] = allEncrData.toString().split(':');
    const ivBuff = Buffer.from(ivText, 'hex');
    const encrBuff = Buffer.from(encText, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGOR, Buffer.concat([Buffer.from(passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    const parsedEnv = dotenv_1.default.parse(decrBuff);
    Object.assign(process.env, parsedEnv);
    // Wrong passwd => empty list of env vars
    if (JSON.stringify(parsedEnv) === '{}') {
        throw new Error('Restored no env variables. Either empty input file or wrong password.');
    }
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
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            passwd = await promptPassword(false);
        }
        else {
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    const encryptedFile = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    if (params && params.encryptedFile && !(0, fs_1.existsSync)(params.encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${params.encryptedFile}" not found`);
    }
    const allEncrData = (0, fs_1.readFileSync)(encryptedFile);
    const [ivText, encText] = allEncrData.toString().split(':');
    const ivBuff = Buffer.from(ivText, 'hex');
    const encrBuff = Buffer.from(encText, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGOR, Buffer.concat([Buffer.from(passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    const parsedEnv = dotenv_1.default.parse(decrBuff);
    Object.assign(process.env, parsedEnv);
    // Wrong passwd => empty list of env vars
    if (JSON.stringify(parsedEnv) === '{}') {
        throw new Error('Restored no env variables. Either empty input file or wrong password.');
    }
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
    const silent = params && params.silent;
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            log({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(true);
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
    const ivBuff = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGOR, Buffer.concat([Buffer.from(passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const encrBuff = Buffer.concat([cipher.update(decryptedEnvContentsBuff), cipher.final()]);
    (0, fs_1.writeFileSync)(encryptedFilename, ivBuff.toString('hex') + ':' + encrBuff.toString('hex'));
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
async function promptPassword(askConfirmation) {
    const { passwd } = await (0, prompts_1.default)({
        type: 'password',
        name: 'passwd',
        message: 'Type password:'
    });
    if (askConfirmation) {
        const { confirmPasswd } = await (0, prompts_1.default)({
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
exports.promptPassword = promptPassword;
//# sourceMappingURL=index.js.map