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
        const [saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const ciphertext = Buffer.from(encText, 'hex');
        // Flipping ciphertext bits deterministically rewrites the plaintext under an
        // unauthenticated stream cipher; GCM's auth tag has to catch it.
        ciphertext[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [saltText, ivText, authTagText, ciphertext.toString('hex')].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject a tampered authentication tag`, async () => {
        const [saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const authTag = Buffer.from(authTagText, 'hex');
        authTag[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [saltText, ivText, authTag.toString('hex'), encText].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject a tampered initialization vector`, async () => {
        const [saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const iv = Buffer.from(ivText, 'hex');
        iv[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [saltText, iv.toString('hex'), authTagText, encText].join(':'));
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject a tampered file via printExport() too`, async () => {
        const [saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const ciphertext = Buffer.from(encText, 'hex');
        ciphertext[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [saltText, ivText, authTagText, ciphertext.toString('hex')].join(':'));
        await (0, chai_1.expect)(dotenvenc.printExport({ passwd: ENC_PASSWD })).to.be.rejectedWith(/tampered with or corrupted/);
    });
    it(`should reject the legacy unauthenticated dotenvenc <= 5.x file format with a clear error`, async () => {
        // legacy format was "<iv>:<ciphertext>" with no auth tag
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, `${'ab'.repeat(16)}:${'cd'.repeat(64)}`);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/older unauthenticated, unsalted format/);
    });
    it(`should reject a non-hex encrypted file with a clear error`, async () => {
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'zzzz:abab:cdcd:efef');
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/salt is not valid hex/);
    });
    it(`should reject an encrypted file whose IV is the wrong length`, async () => {
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, `${'ab'.repeat(16)}:${'cd'.repeat(8)}:${'ef'.repeat(16)}:${'01'.repeat(32)}`);
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: ENC_PASSWD })).to.be.rejectedWith(/initialization vector must be 12 bytes but is 8/);
    });
    it(`should reject a tampered salt`, async () => {
        const [saltText, ivText, authTagText, encText] = (0, fs_1.readFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, 'utf8').split(':');
        const salt = Buffer.from(saltText, 'hex');
        salt[0] ^= 0xff;
        (0, fs_1.writeFileSync)(dotenvenc.DEFAULT_ENCRYPTED_FILE, [salt.toString('hex'), ivText, authTagText, encText].join(':'));
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
        (0, chai_1.expect)(first[0]).to.not.equal(second[0]);
        (0, chai_1.expect)(first[3]).to.not.equal(second[3]);
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.have.property('ALPHA', 'bar');
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
        (0, chai_1.expect)(consoleLogSpy.getCall(0).args[0]).to.equal('ALPHA=bar');
        (0, chai_1.expect)(consoleLogSpy.getCall(1).args[0]).to.equal('BETA=foo bar');
        (0, chai_1.expect)(consoleLogSpy.getCall(2).args[0]).to.equal('GAMMA=1234');
        (0, chai_1.expect)(consoleLogSpy.getCall(3).args[0]).to.equal('DELTA=With \\"double quotes\\" inside');
        (0, chai_1.expect)(consoleLogSpy.getCall(4).args[0]).to.equal('DELTA_2=With \'single quotes\' inside');
        (0, chai_1.expect)(consoleLogSpy.getCall(5).args[0]).to.equal('EPSILON=bla');
        (0, chai_1.expect)(consoleLogSpy.getCall(6).args[0]).to.equal(`KAPPA=multi
line
value`);
    });
    it('should print a dump of "export" statements', async () => {
        const consoleLogSpy = sinon.spy(console, 'log');
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        await dotenvenc.printExport();
        (0, chai_1.expect)(consoleLogSpy.callCount).to.equal(7);
        (0, chai_1.expect)(consoleLogSpy.getCall(0).args[0]).to.equal('export ALPHA="bar";');
        (0, chai_1.expect)(consoleLogSpy.getCall(1).args[0]).to.equal('export BETA="foo bar";');
        (0, chai_1.expect)(consoleLogSpy.getCall(2).args[0]).to.equal('export GAMMA="1234";');
        (0, chai_1.expect)(consoleLogSpy.getCall(3).args[0]).to.equal('export DELTA="With \\"double quotes\\" inside";');
        (0, chai_1.expect)(consoleLogSpy.getCall(4).args[0]).to.equal('export DELTA_2="With \'single quotes\' inside";');
        (0, chai_1.expect)(consoleLogSpy.getCall(5).args[0]).to.equal('export EPSILON="bla";');
        (0, chai_1.expect)(consoleLogSpy.getCall(6).args[0]).to.equal(`export KAPPA="multi
line
value";`);
    });
});
//# sourceMappingURL=dotenvenc.spec.js.map