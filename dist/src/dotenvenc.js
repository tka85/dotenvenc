#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const index_1 = require("./index");
const args = require('minimist')(process.argv.slice(2), {
    boolean: ['e', 'd', 'h'],
    string: ['i', 'o'],
    alias: {
        e: 'encrypt',
        d: 'decrypt',
        i: 'input',
        o: 'output',
        h: 'help',
    }
});
/**
 * @param   {String}    errorMsg       optional error message to print before printing the help syntax
 */
function printHelp(errorMsg) {
    if (errorMsg) {
        console.log(`Error: `, errorMsg);
    }
    console.log(`
* Usage:
    - To encrypt unencrypted env file and persist the encrypted file on disk (will be prompted for password):
    $ ./node_modules/.bin/dotenvenc -e [-i decryptedFile] [-o encryptedFile]

    - To decrypt i.e. to print the contents of an encrypted env file (will be prompted for password):
    $ ./node_modules/.bin/dotenvenc -d [-i encryptedFile]
    
* Arguments:
    -e, --encrypt    to encrypt an unencrypted .env file and write encrypted file on disk
    -d, --decrypt    to decrypt an encrypted .env.enc file and either print on console or return the contents
    -i, --input      the input file (with absolute path); if decrypting this is the encrypted file (default is "${index_1.DEFAULT_ENCRYPTED_FILE}"); if encrypting this is the decrypted file (default is "${index_1.DEFAULT_DECRYPTED_FILE}")
    -o, --output     [for encrypting only] the output file (with absolute path); this is the resulting encrypted file (default is "${index_1.DEFAULT_ENCRYPTED_FILE}")
    -h, --help       print this help

* Encryption examples:
    - To encrypt default unencrypted "${index_1.DEFAULT_DECRYPTED_FILE}" into default encrypted "${index_1.DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -e
    - To encrypt default unencrypted "${index_1.DEFAULT_DECRYPTED_FILE}" into custom encrypted file "/somewhere/else/.env.enc.custom"
        $ ./node_modules/.bin/dotenvenc -e -o /somewhere/else/.env.enc.custom
    - To encrypt custom unencrypted "/elsewhere/.env.custom" into default encrypted file "${index_1.DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -e -i /elsewhere/.env.custom
    - To encrypt custom unencrypted "/elsewhere/.env.custom" into custom encrypted file "/somewhere/else/.env.enc.custom"
        $ ./node_modules/.bin/dotenvenc -e -i /elsewhere/.env.custom -o /somewhere/else/.env.enc.custom

* Decryption example:
    - To decrypt default encrypted "${index_1.DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -d
    - To decrypt custom encrypted "/somewhere/else/.env.enc.custom" into default unencrypted file "${index_1.DEFAULT_DECRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -d -i /somewhere/else/.env.enc.custom
`);
    process.exit(0);
}
async function promptPassword() {
    return await (0, prompts_1.default)({
        type: 'password',
        name: 'passwd',
        message: 'Type password:'
    });
}
(async () => {
    if (args.h) {
        printHelp();
    }
    else {
        if (args.d) {
            let passwd;
            if (!process.env.DOTENVENC_PASS) {
                console.warn('Did not find env variable DOTENVENC_PASS; prompting for decryption password');
                ({ passwd } = await promptPassword());
            }
            else {
                console.log('Env variable DOTENVENC_PASS is set; using it for decryption.');
            }
            (0, index_1.decrypt)({ passwd, encryptedFile: args.i, print: true });
        }
        else if (args.e) {
            let passwd;
            if (!process.env.DOTENVENC_PASS) {
                console.warn('Did not find env variable DOTENVENC_PASS; prompting for encryption password');
                ({ passwd } = await promptPassword());
            }
            else {
                console.log('Env variable DOTENVENC_PASS is set; using it for encryption.');
            }
            (0, index_1.encrypt)({ passwd, decryptedFile: args.i, encryptedFile: args.o });
            console.log(`Wrote encrypted file: ${args.o ?? index_1.DEFAULT_ENCRYPTED_FILE}`);
        }
        else {
            printHelp('Missing either -e to encrypt or -d to decrypt');
        }
    }
})();
//# sourceMappingURL=dotenvenc.js.map