"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptPassword = exports.encryptValuesOnly = exports.encrypt = exports.printExport = exports.decrypt = exports.logInfo = exports.log = exports.CURRENT_FORMAT_VERSION = exports.DEFAULT_DECRYPTED_FILE = exports.DEFAULT_ENCRYPTED_FILE_READABLE = exports.DEFAULT_ENCRYPTED_FILE = void 0;
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
// HKDF label separating the .readable digest key from the file encryption key
const READABLE_KEY_INFO = 'dotenvenc:readable-digest';
const MIN_PASSWORD_LENGTH = 8;
/**
 * Write payload to stdout: the decrypted variables the caller asked for, and nothing else.
 * Anything that is not the answer to the command belongs on stderr, see logInfo().
 */
function log({ data, silent }) {
    if (!silent) {
        console.log(data);
    }
}
exports.log = log;
/**
 * Write a diagnostic to stderr.
 * These used to go to stdout, which corrupted the documented
 * `eval $(dotenvenc -x)` usage: the shell evaluated the informational lines
 * along with the export statements.
 */
function logInfo({ data, silent }) {
    if (!silent) {
        console.error(data);
    }
}
exports.logInfo = logInfo;
/**
 * Check that a resolved password can actually protect anything.
 * An empty password is always a mistake: it used to produce a key of 32 zero bytes,
 * so the file looked encrypted while being readable by anyone. A length floor is
 * applied when creating a file, but not when opening one, so a file is never
 * unopenable just because the floor was raised.
 * @param     {String}    passwd          the resolved password
 * @param     {Boolean}   forEncryption   whether this password is about to create a file
 * @returns   {String}                    the same password, once it is known to be usable
 */
function validatePassword(passwd, forEncryption) {
    if (passwd === undefined || passwd === '') {
        throw new Error('No password supplied; refusing to continue with an empty password');
    }
    if (forEncryption && passwd.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long (got ${passwd.length})`);
    }
    return passwd;
}
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
 * Quote a value so dotenv.parse() reads it back unchanged.
 * dotenv strips surrounding quotes but never unescapes, so escaping is not an
 * option; the only safe move is picking a quote character the value does not use.
 * Single quotes are tried first: inside them dotenv performs no \\n expansion, so
 * newlines, backslashes, quotes and # all survive verbatim.
 * @returns   {String}   the quoted value, or null if no quoting can represent it
 */
function dotenvQuote(value) {
    if (!value.includes(`'`)) {
        return `'${value}'`;
    }
    if (!value.includes('`')) {
        return `\`${value}\``;
    }
    // Double quotes are last: dotenv expands \n and \r inside them, so a value
    // carrying a backslash cannot round-trip.
    if (!value.includes('"') && !value.includes('\\')) {
        return `"${value}"`;
    }
    return null;
}
/**
 * Quote a value for POSIX sh so that `eval` treats it as literal text.
 * Single quotes are the only shell quoting in which no character is special, so
 * the value only has to have its own single quotes broken out: ' -> '\''.
 * Double quotes are not safe here, $(...), `...`, $VAR and \ all stay live inside them.
 */
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
/**
 * A name that `export` will accept. dotenv keys are [\w.-]+, so they can contain
 * dots and dashes or start with a digit, none of which are valid shell identifiers.
 */
const SHELL_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
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
    if (!passwd) {
        if (!process.env.DOTENVENC_PASS) {
            logInfo({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(false, silent);
        }
        else {
            logInfo({ data: '# Decrypted using env variable DOTENVENC_PASS', silent });
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    passwd = validatePassword(passwd, false);
    const encryptedFile = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    const parsedEnv = await decryptFile(encryptedFile, passwd);
    Object.assign(process.env, parsedEnv);
    if (params && params.print) {
        for (const prop in parsedEnv) {
            if (parsedEnv.hasOwnProperty(prop)) {
                const quoted = dotenvQuote(parsedEnv[prop]);
                if (quoted === null) {
                    console.error(`# WARNING: skipping "${prop}", its value mixes quote characters that this .env format cannot represent`);
                    continue;
                }
                log({ data: `${prop}=${quoted}` });
            }
        }
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
            logInfo({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(false, silent);
        }
        else {
            logInfo({ data: '# Decrypted using env variable DOTENVENC_PASS', silent });
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    passwd = validatePassword(passwd, false);
    const encryptedFile = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    const parsedEnv = await decryptFile(encryptedFile, passwd);
    Object.assign(process.env, parsedEnv);
    for (const prop in parsedEnv) {
        if (parsedEnv.hasOwnProperty(prop)) {
            if (!SHELL_IDENTIFIER_RE.test(prop)) {
                // Warn rather than emit; `export A.B=...` is a syntax error that would
                // abort the caller's `eval` and take every following variable with it.
                console.error(`# WARNING: skipping "${prop}", it is not a valid shell variable name`);
                continue;
            }
            log({ data: `export ${prop}=${shellQuote(parsedEnv[prop])};` });
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
            logInfo({ data: '# WARNING: no env variable DOTENVENC_PASS found; prompting for encryption password', silent });
            passwd = await promptPassword(true, silent);
        }
        else {
            logInfo({ data: '# Encrypting using env variable DOTENVENC_PASS', silent });
            passwd = process.env.DOTENVENC_PASS;
        }
    }
    passwd = validatePassword(passwd, true);
    const decryptedFilename = (params && params.decryptedFile) || exports.DEFAULT_DECRYPTED_FILE;
    const encryptedFilename = (params && params.encryptedFile) || exports.DEFAULT_ENCRYPTED_FILE;
    if (!(0, fs_1.existsSync)(decryptedFilename)) {
        throw new Error(`Decrypted secrets input file "${decryptedFilename}" not found`);
    }
    if ((0, fs_1.existsSync)(encryptedFilename)) {
        logInfo({ data: `# WARNING: encrypted secrets output file "${encryptedFilename}" already exists; overwriting...`, silent });
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
        await encryptValuesOnly(encryptedFilename, passwd, parsedEnvContents);
    }
    return encrBuff;
}
exports.encrypt = encrypt;
/**
 * Recover the salt of an existing .readable file so re-encrypting the same secrets
 * keeps producing the same digests. Without that the file cannot be diffed across
 * regenerations, which is the only reason it exists.
 * @returns   {Buffer}   the stored salt, or null if there is no usable one
 */
function readExistingReadableSalt(readableFilename, saltLength) {
    if (!(0, fs_1.existsSync)(readableFilename)) {
        return null;
    }
    try {
        const existing = JSON.parse((0, fs_1.readFileSync)(readableFilename, 'utf8'));
        if (existing && typeof existing.salt === 'string' && HEX_RE.test(existing.salt)) {
            const saltBuff = Buffer.from(existing.salt, 'hex');
            if (saltBuff.length === saltLength) {
                return saltBuff;
            }
        }
    }
    catch {
        // unparseable or written by an older version; fall through and start a new salt
    }
    return null;
}
/**
 * Write the companion .readable file: variable names in the clear, values as keyed digests.
 *
 * The digest key is NOT the password. Keying the HMAC with the password directly turned
 * this file into an offline oracle for the master password: an attacker who could guess
 * any single value (a port, "true", a public URL) could confirm password candidates with
 * one cheap HMAC each. The key is now scrypt-stretched and HKDF-separated, so each guess
 * costs a full scrypt evaluation, the same as attacking the encrypted file itself.
 */
async function encryptValuesOnly(encryptedFilename, passwd, parsedEnvContents) {
    const readableFilename = `${encryptedFilename}.readable`;
    const format = FORMATS[exports.CURRENT_FORMAT_VERSION];
    const saltBuff = readExistingReadableSalt(readableFilename, format.saltLength) || crypto_1.default.randomBytes(format.saltLength);
    const masterKey = await deriveKey(passwd, saltBuff, format);
    const digestKey = Buffer.from(crypto_1.default.hkdfSync('sha256', masterKey, saltBuff, READABLE_KEY_INFO, KEY_LENGTH));
    const digests = {};
    Object.entries(parsedEnvContents).forEach(([varName, value]) => {
        digests[varName] = crypto_1.default.createHmac('sha256', digestKey).update(value).digest('hex');
    });
    (0, fs_1.writeFileSync)(readableFilename, JSON.stringify({
        version: exports.CURRENT_FORMAT_VERSION,
        salt: saltBuff.toString('hex'),
        digests,
    }, null, 2));
}
exports.encryptValuesOnly = encryptValuesOnly;
async function promptPassword(askConfirmation, silent) {
    const { passwd } = await (0, prompts_1.default)({
        type: 'password',
        name: 'passwd',
        message: silent ? '' : 'Type password:',
        stdout: process.stderr,
        // only applied when creating a file; opening one must not be blocked by the floor
        validate: askConfirmation
            ? (value) => value.length >= MIN_PASSWORD_LENGTH || `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
            : undefined,
    });
    // prompts resolves to {} when the user aborts with Ctrl+C, which used to surface
    // as "Buffer.from(undefined)" from deep inside the crypto path
    if (passwd === undefined) {
        throw new Error('Password entry cancelled');
    }
    if (askConfirmation) {
        const { confirmPasswd } = await (0, prompts_1.default)({
            type: 'password',
            name: 'confirmPasswd',
            message: silent ? '' : 'Confirm password:',
            stdout: process.stderr,
        });
        if (confirmPasswd === undefined) {
            throw new Error('Password entry cancelled');
        }
        if (passwd !== confirmPasswd) {
            throw new Error('Password did not match. Exiting.');
        }
    }
    return passwd;
}
exports.promptPassword = promptPassword;
//# sourceMappingURL=index.js.map