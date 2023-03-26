import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

export const DEFAULT_ENCRYPTED_FILE = './.env.enc';
export const DEFAULT_DECRYPTED_FILE = './.env';
const ALGOR = 'aes-256-ctr';
const IV_LENGTH = 16;
const MAX_KEY_LENGTH = 32;
const BUFFER_PADDING = Buffer.alloc(MAX_KEY_LENGTH); // key used in createCipheriv()/createDecipheriv() buffer needs to be 32 bytes

type decryptParams = {
    passwd: string,
    encryptedFile?: string,
    print?: boolean
};

type encryptParams = {
    passwd: string,
    decryptedFile?: string,
    encryptedFile?: string,
};

/**
 * Read encrypted env file and either print it on console or create process.env variables from it
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @param     {Boolean}   [print]           whether to print result on console
 * @returns   {Object}                      the config object as it's parsed by dotenv
 */
export function decrypt(params: decryptParams): { [key: string]: any } {
    if (!params.passwd) {
        throw new Error('Decryption requires a password');
    }
    if (params.encryptedFile && !existsSync(params.encryptedFile)) {
        throw new Error(`Encrypted secrets input file "${params.encryptedFile}" not found`);
    }
    const allEncrData = readFileSync(params.encryptedFile ?? DEFAULT_ENCRYPTED_FILE);
    const [ivText, encText] = allEncrData.toString().split(':');
    const ivBuff = Buffer.from(ivText, 'hex');
    const encrBuff = Buffer.from(encText, 'hex');
    const decipher = crypto.createDecipheriv(ALGOR, Buffer.concat([Buffer.from(params.passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const decrBuff = Buffer.concat([decipher.update(encrBuff), decipher.final()]);
    const parsedEnv = dotenv.parse(decrBuff);
    Object.assign(process.env, parsedEnv);
    if (params.print) {
        console.log('Added to process.env:', parsedEnv);
    }
    return parsedEnv;
}

/**
 * Write to disk encrypted env secrets file from decrypted env secrets file
 * @param     {String}    passwd             the password for encrypting the .env into .env.enc
 * @param     {String}    [decryptedFile]    the full path of decrypted file or DEFAULT_DECRYPTED_PATHNAME if ommitted
 * @param     {String}    [encryptedFile]    the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {Buffer}                       returns Buffer with encrypted data [regardless of whether it persisted it on disk or not]
 */
export function encrypt(params: encryptParams): Buffer {
    if (!params.passwd) {
        throw new Error('Encryption requires a password');
    }
    if (params.decryptedFile && !existsSync(params.decryptedFile)) {
        throw new Error(`Unencrypted secrets input file "${params.decryptedFile}" not found`);
    }
    if (params.encryptedFile && existsSync(params.encryptedFile)) {
        console.warn(`Encrypted secrets output file "${params.encryptedFile}" already exists; overwriting...`);
    }
    const ivBuff = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGOR, Buffer.concat([Buffer.from(params.passwd), BUFFER_PADDING], MAX_KEY_LENGTH), ivBuff);
    const encrBuff = Buffer.concat([cipher.update(readFileSync(params.decryptedFile ?? DEFAULT_DECRYPTED_FILE)), cipher.final()]);
    writeFileSync(params.encryptedFile ?? DEFAULT_ENCRYPTED_FILE, ivBuff.toString('hex') + ':' + encrBuff.toString('hex'));
    return encrBuff;
}