/// <reference types="node" />
export declare const DEFAULT_ENCRYPTED_FILE = "./.env.enc";
export declare const DEFAULT_DECRYPTED_FILE = "./.env";
type decryptParams = {
    passwd?: string;
    encryptedFile?: string;
    print?: boolean;
};
type encryptParams = {
    passwd: string;
    decryptedFile?: string;
    encryptedFile?: string;
};
/**
 * Read encrypted env file and either print it on console or populate process.env from it
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @param     {Boolean}   [print]           whether to print result on console
 * @returns   {Object}                      the config object as it's parsed by dotenv
 */
export declare function decrypt(params?: decryptParams): Promise<{
    [key: string]: any;
}>;
/**
 * Read encrypted env file and print on console "export" statements for the env vars
 * @param     {String}    passwd            the password for decrypting the encrypted .env.enc (memory only;no disk)
 * @param     {String}    [encryptedFile]   the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {void}
 */
export declare function printExport(params?: decryptParams): Promise<void>;
/**
 * Write to disk encrypted env secrets file from decrypted env secrets file
 * @param     {String}    passwd             the password for encrypting the .env into .env.enc
 * @param     {String}    [decryptedFile]    the full path of decrypted file or DEFAULT_DECRYPTED_PATHNAME if ommitted
 * @param     {String}    [encryptedFile]    the full path of encrypted file or DEFAULT_ENCRYPTED_PATHNAME if ommitted
 * @returns   {Buffer}                       returns Buffer with encrypted data [regardless of whether it persisted it on disk or not]
 */
export declare function encrypt(params?: encryptParams): Promise<Buffer>;
export declare function promptPassword(askConfirmation: boolean): Promise<string>;
export {};
