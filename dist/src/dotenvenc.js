#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const args = require('minimist')(process.argv.slice(2), {
    boolean: ['e', 'r', 'd', 'h'],
    string: ['i', 'o'],
    alias: {
        e: 'encrypt',
        d: 'decrypt',
        i: 'input',
        o: 'output',
        x: 'export',
        r: 'readable',
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

    - To dump the contents of an encrypted env file as "export" statements for use in a bash shell (will be prompted for password):
    $ ./node_modules/.bin/dotenvenc -x [-i encryptedFile]
    
* Arguments:
    -e, --encrypt    to encrypt an unencrypted .env file and write encrypted file on disk
    -d, --decrypt    to decrypt an encrypted .env.enc file and either print on console or return the contents
    -i, --input      the input file (with absolute path); if decrypting this is the encrypted file (default is "${index_1.DEFAULT_ENCRYPTED_FILE}"); if encrypting this is the decrypted file (default is "${index_1.DEFAULT_DECRYPTED_FILE}")
    -o, --output     [for encrypting only] the output file (with absolute path); this is the resulting encrypted file (default is "${index_1.DEFAULT_ENCRYPTED_FILE}")
    -x, --export     to dump as "export" statements the contents of an encrypted .env.enc file
    -r, --readable   to also add a .env.enc.readable when encrypting a .env which will contain have only the values encrypted
    -s, --silent     do not print informative messages; only errors and warnings
    -h, --help       print this help

* Encryption examples:
    - To encrypt default unencrypted "${index_1.DEFAULT_DECRYPTED_FILE}" into default encrypted "${index_1.DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -e
    - To encrypt default unencrypted "${index_1.DEFAULT_DECRYPTED_FILE}" into default encrypted "${index_1.DEFAULT_ENCRYPTED_FILE}" plus get a semi-readable "${index_1.DEFAULT_ENCRYPTED_FILE_READABLE}"
        $ ./node_modules/.bin/dotenvenc -e -r
    - To encrypt default unencrypted "${index_1.DEFAULT_DECRYPTED_FILE}" into custom encrypted file "/somewhere/else/.env.enc.custom"
        $ ./node_modules/.bin/dotenvenc -e -o /somewhere/else/.env.enc.custom
    - To encrypt default unencrypted "${index_1.DEFAULT_DECRYPTED_FILE}" into custom encrypted file "/somewhere/else/.env.enc.custom" plus get a semi-readable "/somewhere/else/.env.enc.custom.readable"
        $ ./node_modules/.bin/dotenvenc -e -r -o /somewhere/else/.env.enc.custom
    - To encrypt custom unencrypted "/elsewhere/.env.custom" into default encrypted file "${index_1.DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -e -i /elsewhere/.env.custom
    - To encrypt custom unencrypted "/elsewhere/.env.custom" into custom encrypted file "/somewhere/else/.env.enc.custom"
        $ ./node_modules/.bin/dotenvenc -e -i /elsewhere/.env.custom -o /somewhere/else/.env.enc.custom

* Decryption example:
    - To decrypt default encrypted "${index_1.DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -d
    - To decrypt custom encrypted "/somewhere/else/.env.enc.custom" into default unencrypted file "${index_1.DEFAULT_DECRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -d -i /somewhere/else/.env.enc.custom

* Export example:
    - To dump default encrypted "${index_1.DEFAULT_ENCRYPTED_FILE}" as "export" statements:
        $ ./node_modules/.bin/dotenvenc - 
`);
    process.exit(0);
}
(async () => {
    if (args.h) {
        printHelp();
    }
    else {
        let passwd;
        if (args.d) {
            await (0, index_1.decrypt)({ passwd, encryptedFile: args.i, print: true });
        }
        else if (args.e) {
            await (0, index_1.encrypt)({ passwd, decryptedFile: args.i, encryptedFile: args.o, includeReadable: args.r });
            console.log(`Saved encrypted file: ${args.o ?? index_1.DEFAULT_ENCRYPTED_FILE}`);
            if (args.r) {
                console.log(`And additionally saved semi-encrypted file: ${args.o ?? index_1.DEFAULT_ENCRYPTED_FILE}.readable`);
            }
        }
        else if (args.x) {
            await (0, index_1.printExport)({ passwd, encryptedFile: args.i });
        }
        else {
            printHelp('Missing either -e to encrypt or -d to decrypt');
        }
    }
})();
//# sourceMappingURL=dotenvenc.js.map