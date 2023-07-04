#!/usr/bin/env node
import { encrypt, decrypt, DEFAULT_DECRYPTED_FILE, DEFAULT_ENCRYPTED_FILE, printExport } from './index';

const args = require('minimist')(process.argv.slice(2), {
    boolean: ['e', 'd', 'h'],
    string: ['i', 'o'],
    alias: {
        e: 'encrypt',
        d: 'decrypt',
        i: 'input',
        o: 'output',
        x: 'export',
        h: 'help',
    }
});


/**
 * @param   {String}    errorMsg       optional error message to print before printing the help syntax
 */
function printHelp(errorMsg?: string) {
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
    -i, --input      the input file (with absolute path); if decrypting this is the encrypted file (default is "${DEFAULT_ENCRYPTED_FILE}"); if encrypting this is the decrypted file (default is "${DEFAULT_DECRYPTED_FILE}")
    -o, --output     [for encrypting only] the output file (with absolute path); this is the resulting encrypted file (default is "${DEFAULT_ENCRYPTED_FILE}")
    -x, --export     to dump as "export" statements the contents of an encrypted .env.enc file
    -h, --help       print this help

* Encryption examples:
    - To encrypt default unencrypted "${DEFAULT_DECRYPTED_FILE}" into default encrypted "${DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -e
    - To encrypt default unencrypted "${DEFAULT_DECRYPTED_FILE}" into custom encrypted file "/somewhere/else/.env.enc.custom"
        $ ./node_modules/.bin/dotenvenc -e -o /somewhere/else/.env.enc.custom
    - To encrypt custom unencrypted "/elsewhere/.env.custom" into default encrypted file "${DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -e -i /elsewhere/.env.custom
    - To encrypt custom unencrypted "/elsewhere/.env.custom" into custom encrypted file "/somewhere/else/.env.enc.custom"
        $ ./node_modules/.bin/dotenvenc -e -i /elsewhere/.env.custom -o /somewhere/else/.env.enc.custom

* Decryption example:
    - To decrypt default encrypted "${DEFAULT_ENCRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -d
    - To decrypt custom encrypted "/somewhere/else/.env.enc.custom" into default unencrypted file "${DEFAULT_DECRYPTED_FILE}"
        $ ./node_modules/.bin/dotenvenc -d -i /somewhere/else/.env.enc.custom

* Export example:
    - To dump default encrypted "${DEFAULT_ENCRYPTED_FILE}" as "export" statements:
        $ ./node_modules/.bin/dotenvenc - 
`);
    process.exit(0);
}

(async () => {
    if (args.h) {
        printHelp();
    } else {
        let passwd;
        if (args.d) {
            await decrypt({ passwd, encryptedFile: args.i, print: true });
        } else if (args.e) {
            await encrypt({ passwd, decryptedFile: args.i, encryptedFile: args.o });
            console.log(`Saved encrypted file: ${args.o ?? DEFAULT_ENCRYPTED_FILE}`)
        } else if (args.x) {
            await printExport({ passwd, encryptedFile: args.i });
        } else {
            printHelp('Missing either -e to encrypt or -d to decrypt');
        }
    }
})();
