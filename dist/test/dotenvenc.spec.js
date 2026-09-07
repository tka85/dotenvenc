"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ENC_PASSWD = 'superDuperPassword';
const WRONG_ENC_PASSWD = 'wrong-password';
const TEST_SAMPLE_DECRYPTED_FILE = './test/.env.sample';
const TEST_SAMPLE_ENCRYPTED_FILE = './test/.env.sample.enc';
const TEST_SAMPLE_ENCRYPTED_FILE_READABLE = './test/.env.sample.enc.readable';
const CUSTOM_DECRYPTED_FILE = './.env.custom';
const CUSTOM_ENCRYPTED_FILE = './.env.enc.custom';
const CUSTOM_ENCRYPTED_FILE_READABLE = './.env.enc.custom.readable';
const rewire = require("rewire");
const dotenvenc = rewire('../src/index');
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const dotenv_1 = require("dotenv");
const crypto_1 = require("crypto");
const chai_1 = require("chai");
const sinon = __importStar(require("sinon"));
const chai_2 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const src_1 = require("../src");
chai_2.default.use(chai_as_promised_1.default);
function removeFile(filename) {
    try {
        (0, fs_1.unlinkSync)(filename);
    }
    catch (err) {
        // file didn't exist; ignore
    }
}
describe('encryption', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore decrypted files from pristine test sample files
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_DECRYPTED_FILE, (0, fs_1.readFileSync)(TEST_SAMPLE_DECRYPTED_FILE));
        (0, fs_1.writeFileSync)(CUSTOM_DECRYPTED_FILE, (0, fs_1.readFileSync)(TEST_SAMPLE_DECRYPTED_FILE));
    });
    afterEach(() => {
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE_READABLE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE_READABLE);
    });
    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} without semi-readable '.readable' file generated`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: dotenvenc.DEFAULT_DECRYPTED_FILE, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE, includeReadable: false });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} also with semi-readable '.readable' file generated`, async () => {
        // seed the salt from the fixture so the digests are reproducible
        (0, fs_1.writeFileSync)(src_1.DEFAULT_ENCRYPTED_FILE_READABLE, (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE_READABLE));
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: dotenvenc.DEFAULT_DECRYPTED_FILE, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE, includeReadable: true });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        const encryptedFileReadableContents = (0, fs_1.readFileSync)(src_1.DEFAULT_ENCRYPTED_FILE_READABLE, 'utf8');
        const encryptedFileReadableContentsReference = (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE_READABLE, 'utf8');
        (0, chai_1.expect)(encryptedFileReadableContents).to.be.equal(encryptedFileReadableContentsReference);
    });
    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE} without semi-readable '.readable' file generated`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE, includeReadable: false });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE} also with semi-readable '.readable' file generated`, async () => {
        (0, fs_1.writeFileSync)(CUSTOM_ENCRYPTED_FILE_READABLE, (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE_READABLE));
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE, includeReadable: true });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        const encryptedFileReadableContents = (0, fs_1.readFileSync)(CUSTOM_ENCRYPTED_FILE_READABLE, 'utf8');
        const encryptedFileReadableContentsReference = (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE_READABLE, 'utf8');
        (0, chai_1.expect)(encryptedFileReadableContents).to.be.equal(encryptedFileReadableContentsReference);
    });
    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} without semi-readable '.readable' file generated`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, includeReadable: false });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} also with semi-readable '.readable' file generated`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, includeReadable: true });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should prompt for password if provided empty password and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.encrypt({ passwd: '' });
        (0, chai_1.expect)(promptPasswordSpy.calledOnceWith(true)).to.equal(true);
        revert();
    });
    it(`should prompt for password if no password is provided and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.encrypt();
        (0, chai_1.expect)(promptPasswordSpy.calledOnceWith(true)).to.equal(true);
        revert();
    });
    it(`should encrypt default decrypted file with DOTENVENC_PASS if empty password is provided and DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        await dotenvenc.encrypt({ passwd: '' });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt default decrypted file with DOTENVENC_PASS if no password is provided and DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        await dotenvenc.encrypt();
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
});
describe('decryption', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore encrypted files from pristine sample
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE));
        (0, fs_1.writeFileSync)(CUSTOM_ENCRYPTED_FILE, (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE));
    });
    afterEach(() => {
        sinon.restore();
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });
    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} correctly if explicitly passed password`, async () => {
        const data = await dotenvenc.decrypt({ passwd: ENC_PASSWD });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} correctly if DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt();
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} correctly`, async () => {
        const data = await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ passwd: '' });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt();
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ passwd: '', encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
    });
    it(`should prompt for password if provided empty password and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.decrypt({ passwd: '' });
        (0, chai_1.expect)(promptPasswordSpy.calledOnceWith(false)).to.equal(true);
        revert();
    });
    it(`should prompt for password if no password is provided and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.decrypt();
        (0, chai_1.expect)(promptPasswordSpy.calledOnceWith(false)).to.equal(true);
        revert();
    });
    it(`should throw error if wrong decryption password is supplied`, async () => {
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: WRONG_ENC_PASSWD })).to.be.rejectedWith(/wrong password, or the file has been tampered with or corrupted/);
    });
    it(`should reject a tampered ciphertext instead of returning altered secrets`, async () => {
        const [version, saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const ciphertext = Buffer.from(encText, 'hex');
        // Flipping ciphertext bits deterministically rewrites the plaintext under an
        // unauthenticated stream cipher; GCM's auth tag has to catch it.
        ciphertext[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [version, saltText, ivText, authTagText, ciphertext.toString('hex')].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject a tampered authentication tag`, async () => {
        const [version, saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const authTag = Buffer.from(authTagText, 'hex');
        authTag[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [version, saltText, ivText, authTag.toString('hex'), encText].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject a tampered initialization vector`, async () => {
        const [version, saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const iv = Buffer.from(ivText, 'hex');
        iv[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [version, saltText, iv.toString('hex'), authTagText, encText].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject a tampered file via printExport() too`, async () => {
        const [version, saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const ciphertext = Buffer.from(encText, 'hex');
        ciphertext[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [version, saltText, ivText, authTagText, ciphertext.toString('hex')].join(':'));
        await (0, chai_1.expect)(dotenvenc.printExport({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject the legacy unauthenticated dotenvenc <= 5.x file format with a clear error`, async () => {
        // legacy format was "<iv>:<ciphertext>" with no auth tag
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, `${'ab'.repeat(16)}:${'cd'.repeat(64)}`);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/does not start with a format version tag/);
    });
    it(`should reject a non-hex encrypted file with a clear error`, async () => {
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, `${dotenvenc.CURRENT_FORMAT_VERSION}:zzzz:abab:cdcd:efef`);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/salt is not valid hex/);
    });
    it(`should reject an encrypted file whose IV is the wrong length`, async () => {
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, `${dotenvenc.CURRENT_FORMAT_VERSION}:${'ab'.repeat(16)}:${'cd'.repeat(8)}:${'ef'.repeat(16)}:${'01'.repeat(32)}`);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/initialization vector must be 12 bytes but is 8/);
    });
    it(`should reject a tampered salt`, async () => {
        const [version, saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const salt = Buffer.from(saltText, 'hex');
        salt[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [version, salt.toString('hex'), ivText, authTagText, encText].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should use the whole password rather than truncating it to 32 bytes`, async () => {
        // These two passwords share their first 32 bytes. Zero-padding the raw password
        // to a 32 byte key made them interchangeable; scrypt hashes the whole string.
        const longPasswd = `${'A'.repeat(32)}SECRET-SUFFIX-XYZ`;
        const sharedPrefixPasswd = `${'A'.repeat(32)}totally-different`;
        await dotenvenc.encrypt({ passwd: longPasswd, decryptedFile: TEST_SAMPLE_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, silent: true });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: longPasswd, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.have.property('ALPHA', 'bar');
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: sharedPrefixPasswd, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.be.rejectedWith(/wrong password/);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: 'A'.repeat(32), encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.be.rejectedWith(/wrong password/);
    });
    it(`should derive a fresh random salt on every encryption`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: TEST_SAMPLE_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, silent: true });
        const first = (0, fs_1.readFileSync)(CUSTOM_ENCRYPTED_FILE, 'utf8').split(':');
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: TEST_SAMPLE_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, silent: true });
        const second = (0, fs_1.readFileSync)(CUSTOM_ENCRYPTED_FILE, 'utf8').split(':');
        // same password, same plaintext => different salt, different key, different ciphertext
        (0, chai_1.expect)(first[1]).to.not.equal(second[1]);
        (0, chai_1.expect)(first[4]).to.not.equal(second[4]);
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.have.property('ALPHA', 'bar');
    });
    it(`should write the current format version tag`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: TEST_SAMPLE_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, silent: true });
        (0, chai_1.expect)((0, fs_1.readFileSync)(CUSTOM_ENCRYPTED_FILE, 'utf8').split(':')[0]).to.equal(dotenvenc.CURRENT_FORMAT_VERSION);
    });
    it(`should tell the user to upgrade when the file declares a newer format version`, async () => {
        const [, ...rest] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, ['v999', ...rest].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/declares format "v999".*Upgrade dotenvenc/);
    });
    it(`should throw Error if the default encrypted secrets file does not exist`, async () => {
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/Encrypted secrets input file "\.\/\.env\.enc" not found/);
    });
    it(`should throw Error if provided encrypted secrets file does not exist`, async () => {
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: 'doesnotmatter', encryptedFile: '/non/existent/file' })).to.be.rejectedWith(/Encrypted secrets input file "\/non\/existent\/file" not found/);
    });
    it(`should console.log() decrypted env vars if passed "print: true"`, async () => {
        const consoleLogSpy = sinon.spy(console, 'log');
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ print: true });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('1234');
        (0, chai_1.expect)(process.env.DELTA).to.equal('With \"double quotes\" inside');
        (0, chai_1.expect)(process.env.DELTA_2).to.equal('With \'single quotes\' inside');
        (0, chai_1.expect)(process.env.EPSILON).to.equal('bla');
        (0, chai_1.expect)(consoleLogSpy.callCount).to.equal(7);
        (0, chai_1.expect)(consoleLogSpy.getCall(0).args[0]).to.equal(`ALPHA='bar'`);
        (0, chai_1.expect)(consoleLogSpy.getCall(1).args[0]).to.equal(`BETA='foo bar'`);
        (0, chai_1.expect)(consoleLogSpy.getCall(2).args[0]).to.equal(`GAMMA='1234'`);
        (0, chai_1.expect)(consoleLogSpy.getCall(3).args[0]).to.equal(`DELTA='With "double quotes" inside'`);
        (0, chai_1.expect)(consoleLogSpy.getCall(4).args[0]).to.equal('DELTA_2=`With \'single quotes\' inside`');
        (0, chai_1.expect)(consoleLogSpy.getCall(5).args[0]).to.equal(`EPSILON='bla'`);
        (0, chai_1.expect)(consoleLogSpy.getCall(6).args[0]).to.equal(`KAPPA='multi
line
value'`);
    });
    it(`should print values that dotenv parses back unchanged`, async () => {
        // -d output is documented as the way to recreate a lost .env, so it has to
        // survive a round trip through dotenv.parse().
        const nasty = ['QUOTES=`With "double quotes" inside`', 'NEWLINE=`multi\nline\nvalue`', 'DOLLAR=`cost $5 #hash`', 'BACKSLASH=`path\\to`', "SINGLE=`it's here`", 'EMPTY=``'].join('\n');
        (0, fs_1.writeFileSync)(CUSTOM_DECRYPTED_FILE, `${nasty}\n`);
        const expected = (0, dotenv_1.parse)((0, fs_1.readFileSync)(CUSTOM_DECRYPTED_FILE));
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE, silent: true });
        const consoleLogSpy = sinon.spy(console, 'log');
        await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE, print: true });
        const printed = consoleLogSpy.getCalls().map((call) => call.args[0]).join('\n');
        sinon.restore();
        (0, chai_1.expect)((0, dotenv_1.parse)(printed)).to.deep.equal(expected);
    });
    it('should print a dump of "export" statements', async () => {
        const consoleLogSpy = sinon.spy(console, 'log');
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        await dotenvenc.printExport();
        (0, chai_1.expect)(consoleLogSpy.callCount).to.equal(7);
        (0, chai_1.expect)(consoleLogSpy.getCall(0).args[0]).to.equal(`export ALPHA='bar';`);
        (0, chai_1.expect)(consoleLogSpy.getCall(1).args[0]).to.equal(`export BETA='foo bar';`);
        (0, chai_1.expect)(consoleLogSpy.getCall(2).args[0]).to.equal(`export GAMMA='1234';`);
        (0, chai_1.expect)(consoleLogSpy.getCall(3).args[0]).to.equal(`export DELTA='With "double quotes" inside';`);
        (0, chai_1.expect)(consoleLogSpy.getCall(4).args[0]).to.equal(`export DELTA_2='With '\\''single quotes'\\'' inside';`);
        (0, chai_1.expect)(consoleLogSpy.getCall(5).args[0]).to.equal(`export EPSILON='bla';`);
        (0, chai_1.expect)(consoleLogSpy.getCall(6).args[0]).to.equal(`export KAPPA='multi
line
value';`);
    });
});
describe('cli', () => {
    const CLI_ENCRYPTED_FILE = './.env.enc.cli';
    // Run the CLI the way a user does, straight from source, so argument parsing
    // is exercised end to end rather than re-declared in the test.
    function runCli(cliArgs) {
        const result = (0, child_process_1.spawnSync)(process.execPath, ['-r', 'ts-node/register', 'src/dotenvenc.ts', ...cliArgs], {
            encoding: 'utf8',
            env: { ...process.env, DOTENVENC_PASS: ENC_PASSWD },
        });
        return { stdout: result.stdout, stderr: result.stderr, status: result.status };
    }
    afterEach(() => {
        removeFile(CLI_ENCRYPTED_FILE);
        removeFile(`${CLI_ENCRYPTED_FILE}.readable`);
    });
    it('should print informative messages on stderr, never stdout', () => {
        const { stdout, stderr } = runCli(['-e', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CLI_ENCRYPTED_FILE]);
        (0, chai_1.expect)(stderr).to.contain('Encrypting using env variable DOTENVENC_PASS');
        (0, chai_1.expect)(stderr).to.contain('Saved encrypted file');
        (0, chai_1.expect)(stdout).to.equal('');
    });
    it('should suppress informative messages with -s', () => {
        const { stdout, stderr } = runCli(['-e', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CLI_ENCRYPTED_FILE, '-s']);
        (0, chai_1.expect)(stdout).to.equal('');
        (0, chai_1.expect)(stderr).to.equal('');
    });
    it('should suppress informative messages with --silent', () => {
        const { stdout, stderr } = runCli(['-e', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CLI_ENCRYPTED_FILE, '--silent']);
        (0, chai_1.expect)(stdout).to.equal('');
        (0, chai_1.expect)(stderr).to.equal('');
    });
    it('should treat -s as a flag rather than consuming the next argument', () => {
        const { stdout } = runCli(['-e', '-s', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CLI_ENCRYPTED_FILE]);
        (0, chai_1.expect)(stdout).to.equal('');
        (0, chai_1.expect)((0, fs_1.existsSync)(CLI_ENCRYPTED_FILE)).to.equal(true);
    });
    it('should round-trip through the CLI: -e then -d prints the secrets', () => {
        runCli(['-e', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CLI_ENCRYPTED_FILE, '--silent']);
        const { stdout } = runCli(['-d', '-i', CLI_ENCRYPTED_FILE, '--silent']);
        (0, chai_1.expect)(stdout).to.contain(`ALPHA='bar'`);
        (0, chai_1.expect)(stdout).to.contain(`GAMMA='1234'`);
    });
    it('should keep stdout clean enough for `eval $(dotenvenc -x)` even while reporting on stderr', () => {
        runCli(['-e', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CLI_ENCRYPTED_FILE, '--silent']);
        // no --silent here: the informational line must land on stderr, out of eval's way
        const { stdout, stderr } = runCli(['-x', '-i', CLI_ENCRYPTED_FILE]);
        (0, chai_1.expect)(stderr).to.contain('DOTENVENC_PASS');
        // stdout must carry export statements only; KAPPA is multi-line, so check that
        // no diagnostic leaked rather than that every line starts with "export"
        (0, chai_1.expect)(stdout).to.not.contain('DOTENVENC_PASS');
        (0, chai_1.expect)(stdout).to.not.contain('WARNING');
        (0, chai_1.expect)(stdout.startsWith('export ')).to.equal(true);
        const values = (0, child_process_1.execFileSync)('bash', ['-c', `${stdout}\nprintf '%s|%s' "$BETA" "$KAPPA"`], { encoding: 'utf8' });
        (0, chai_1.expect)(values).to.equal('foo bar|multi\nline\nvalue');
    });
    it('should exit non-zero and report on stderr when neither -e nor -d nor -x is given', () => {
        const { stdout, stderr, status } = runCli([]);
        (0, chai_1.expect)(status).to.equal(1);
        (0, chai_1.expect)(stderr).to.contain('Missing either -e to encrypt or -d to decrypt');
        (0, chai_1.expect)(stdout).to.equal('');
    });
    it('should print help to stdout and exit zero for -h', () => {
        const { stdout, status } = runCli(['-h']);
        (0, chai_1.expect)(status).to.equal(0);
        (0, chai_1.expect)(stdout).to.contain('Usage:');
    });
});
describe('shell export quoting', () => {
    const HOSTILE_DECRYPTED_FILE = './.env.hostile';
    const HOSTILE_ENCRYPTED_FILE = './.env.enc.hostile';
    // Values a shell would otherwise interpret: command substitution, quotes,
    // parameter expansion and a command separator.
    const HOSTILE_ENV = [
        'INNOCENT=hello',
        'CMD_SUBST=$(id -un)',
        'BACKTICKS=$(hostname)',
        `SINGLE=it's got a quote`,
        'DQUOTE=say "hi" now',
        'EXPANSION=$HOME and ${PATH}',
        'SEPARATOR=a; echo pwned',
        'TRAILING_BACKSLASH=ends with \\',
    ].join('\n');
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        (0, fs_1.writeFileSync)(HOSTILE_DECRYPTED_FILE, `${HOSTILE_ENV}\n`);
    });
    afterEach(() => {
        sinon.restore();
        removeFile(HOSTILE_DECRYPTED_FILE);
        removeFile(HOSTILE_ENCRYPTED_FILE);
    });
    it('should emit values that a real shell `eval` leaves byte for byte intact', async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: HOSTILE_DECRYPTED_FILE, encryptedFile: HOSTILE_ENCRYPTED_FILE, silent: true });
        const expected = await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: HOSTILE_ENCRYPTED_FILE });
        const consoleLogSpy = sinon.spy(console, 'log');
        await dotenvenc.printExport({ passwd: ENC_PASSWD, encryptedFile: HOSTILE_ENCRYPTED_FILE });
        const script = consoleLogSpy.getCalls().map((call) => call.args[0]).join('\n');
        sinon.restore();
        // Round-trip the emitted script through bash exactly as the README's `eval` does,
        // then print each value back with a NUL separator so nothing can be misread.
        const names = Object.keys(expected);
        const readBack = (0, child_process_1.execFileSync)('bash', ['-c', `${script}\nfor v in ${names.join(' ')}; do printf '%s\\0' "\${!v}"; done`], { encoding: 'utf8' });
        const actual = readBack.split('\0').slice(0, names.length);
        names.forEach((name, i) => {
            (0, chai_1.expect)(actual[i], `value of ${name} survived eval`).to.equal(expected[name]);
        });
    });
    it('should not execute command substitution present in a secret', async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: HOSTILE_DECRYPTED_FILE, encryptedFile: HOSTILE_ENCRYPTED_FILE, silent: true });
        const consoleLogSpy = sinon.spy(console, 'log');
        await dotenvenc.printExport({ passwd: ENC_PASSWD, encryptedFile: HOSTILE_ENCRYPTED_FILE });
        const script = consoleLogSpy.getCalls().map((call) => call.args[0]).join('\n');
        sinon.restore();
        const out = (0, child_process_1.execFileSync)('bash', ['-c', `${script}\nprintf '%s' "$CMD_SUBST"`], { encoding: 'utf8' });
        (0, chai_1.expect)(out).to.equal('$(id -un)');
        (0, chai_1.expect)(out).to.not.equal((0, child_process_1.execFileSync)('id', ['-un'], { encoding: 'utf8' }).trim());
    });
    it('should skip names that are not valid shell identifiers instead of breaking the eval', async () => {
        (0, fs_1.writeFileSync)(HOSTILE_DECRYPTED_FILE, 'GOOD=fine\nBAD.NAME=nope\nALSO_GOOD=fine2\n');
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: HOSTILE_DECRYPTED_FILE, encryptedFile: HOSTILE_ENCRYPTED_FILE, silent: true });
        const consoleLogSpy = sinon.spy(console, 'log');
        const consoleErrorSpy = sinon.spy(console, 'error');
        await dotenvenc.printExport({ passwd: ENC_PASSWD, encryptedFile: HOSTILE_ENCRYPTED_FILE });
        const emitted = consoleLogSpy.getCalls().map((call) => call.args[0]);
        const warnings = consoleErrorSpy.getCalls().map((call) => call.args[0]);
        sinon.restore();
        (0, chai_1.expect)(emitted).to.deep.equal([`export GOOD='fine';`, `export ALSO_GOOD='fine2';`]);
        (0, chai_1.expect)(warnings.join('\n')).to.match(/skipping "BAD\.NAME"/);
    });
});
describe('readable digest file', () => {
    const READABLE_DECRYPTED_FILE = './.env.readable-src';
    const READABLE_ENCRYPTED_FILE = './.env.enc.readable-src';
    const READABLE_DIGEST_FILE = `${READABLE_ENCRYPTED_FILE}.readable`;
    function writeSecrets(secretValue) {
        (0, fs_1.writeFileSync)(READABLE_DECRYPTED_FILE, `GAMMA=1234\nSECRET=${secretValue}\n`);
    }
    async function generate(passwd = ENC_PASSWD) {
        await dotenvenc.encrypt({ passwd, decryptedFile: READABLE_DECRYPTED_FILE, encryptedFile: READABLE_ENCRYPTED_FILE, includeReadable: true, silent: true });
        return JSON.parse((0, fs_1.readFileSync)(READABLE_DIGEST_FILE, 'utf8'));
    }
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        writeSecrets('hunter2');
    });
    afterEach(() => {
        removeFile(READABLE_DECRYPTED_FILE);
        removeFile(READABLE_ENCRYPTED_FILE);
        removeFile(READABLE_DIGEST_FILE);
    });
    it('should not key the digest with the raw password', async () => {
        const readable = await generate();
        // The old scheme was HMAC-SHA256(key=password, value), which let anyone who could
        // guess one value confirm password candidates at HMAC speed.
        const rawPasswordDigest = (0, crypto_1.createHmac)('sha256', ENC_PASSWD).update('1234').digest('hex');
        (0, chai_1.expect)(readable.digests.GAMMA).to.not.equal(rawPasswordDigest);
    });
    it('should keep digests stable across re-encryption so the file stays diffable', async () => {
        const first = await generate();
        const second = await generate();
        (0, chai_1.expect)(second.salt).to.equal(first.salt);
        (0, chai_1.expect)(second.digests).to.deep.equal(first.digests);
    });
    it('should change only the digest of a value that changed', async () => {
        const before = await generate();
        writeSecrets('CHANGED');
        const after = await generate();
        (0, chai_1.expect)(after.digests.SECRET).to.not.equal(before.digests.SECRET);
        (0, chai_1.expect)(after.digests.GAMMA).to.equal(before.digests.GAMMA);
    });
    it('should use a fresh random salt when there is no previous digest file', async () => {
        const first = await generate();
        removeFile(READABLE_DIGEST_FILE);
        const second = await generate();
        (0, chai_1.expect)(second.salt).to.not.equal(first.salt);
        (0, chai_1.expect)(second.digests.GAMMA).to.not.equal(first.digests.GAMMA);
    });
    it('should start a fresh salt if the existing digest file is unusable', async () => {
        (0, fs_1.writeFileSync)(READABLE_DIGEST_FILE, 'not json at all');
        const readable = await generate();
        (0, chai_1.expect)(readable.salt).to.match(/^[0-9a-f]{32}$/);
        (0, chai_1.expect)(readable.version).to.equal(dotenvenc.CURRENT_FORMAT_VERSION);
    });
    it('should produce different digests for the same value under different passwords', async () => {
        const first = await generate();
        removeFile(READABLE_DIGEST_FILE);
        const second = await generate('a-completely-different-password');
        (0, chai_1.expect)(second.digests.GAMMA).to.not.equal(first.digests.GAMMA);
    });
});
describe('password validation', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_DECRYPTED_FILE, (0, fs_1.readFileSync)(TEST_SAMPLE_DECRYPTED_FILE));
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, (0, fs_1.readFileSync)(TEST_SAMPLE_ENCRYPTED_FILE));
    });
    afterEach(() => {
        sinon.restore();
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE_READABLE);
    });
    it('should refuse to encrypt with a password below the minimum length', async () => {
        await (0, chai_1.expect)(dotenvenc.encrypt({ passwd: 'short12' })).to.be.rejectedWith(/at least 8 characters long \(got 7\)/);
    });
    it('should accept a password at exactly the minimum length', async () => {
        await dotenvenc.encrypt({ passwd: '12345678', silent: true });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: '12345678' })).to.have.property('ALPHA', 'bar');
    });
    it('should not apply the length floor when decrypting, only when encrypting', async () => {
        // a short password must fail as a wrong password, not be rejected up front,
        // so raising the floor can never make an existing file unopenable
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: 'abc' })).to.be.rejectedWith(/wrong password/);
    });
    it('should refuse an empty password returned from the prompt when encrypting', async () => {
        const revert = dotenvenc.__set__('promptPassword', async () => Promise.resolve(''));
        try {
            await (0, chai_1.expect)(dotenvenc.encrypt({ passwd: '' })).to.be.rejectedWith(/refusing to continue with an empty password/);
        }
        finally {
            revert();
        }
    });
    it('should refuse an empty password returned from the prompt when decrypting', async () => {
        const revert = dotenvenc.__set__('promptPassword', async () => Promise.resolve(''));
        try {
            await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: '' })).to.be.rejectedWith(/refusing to continue with an empty password/);
        }
        finally {
            revert();
        }
    });
    it('should exit with an error when the password prompt is cancelled with Ctrl+C', async () => {
        const env = { ...process.env };
        delete env.DOTENVENC_PASS;
        const child = (0, child_process_1.spawn)(process.execPath, ['-r', 'ts-node/register', 'src/dotenvenc.ts', '-e', '-i', TEST_SAMPLE_DECRYPTED_FILE, '-o', CUSTOM_ENCRYPTED_FILE], { env, stdio: ['pipe', 'pipe', 'pipe'] });
        let stderr = '';
        child.stderr.on('data', (chunk) => { stderr += chunk; });
        const exitCode = await new Promise((resolve) => {
            // give the prompt time to render, then send the Ctrl+C byte
            setTimeout(() => child.stdin.write(Buffer.from([0x03])), 1500);
            const killTimer = setTimeout(() => child.kill(), 20000);
            child.on('close', (code) => { clearTimeout(killTimer); resolve(code); });
        });
        // before this change the confirmation prompt was still shown after the abort
        // and the process hung there forever
        (0, chai_1.expect)(exitCode, 'process exited rather than hanging').to.equal(1);
        (0, chai_1.expect)(stderr).to.match(/Password entry cancelled/);
        (0, chai_1.expect)((0, fs_1.existsSync)(CUSTOM_ENCRYPTED_FILE)).to.equal(false);
    });
});
//# sourceMappingURL=dotenvenc.spec.js.map