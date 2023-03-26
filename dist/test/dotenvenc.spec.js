"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ENC_PASSWD = 'superDuperPassword';
const TEST_SAMPLE_DECRYPTED_FILE = './test/.env.sample';
const TEST_SAMPLE_ENCRYPTED_FILE = './test/.env.enc.sample';
const CUSTOM_DECRYPTED_FILE = './.env.custom';
const CUSTOM_ENCRYPTED_FILE = './.env.enc.custom';
const index_1 = require("../src/index");
const fs_1 = __importDefault(require("fs"));
const chai_1 = require("chai");
function removeFile(filename) {
    try {
        fs_1.default.unlinkSync(filename);
    }
    catch (err) {
        // file didn't exist; ignore
    }
}
describe('encryption', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(index_1.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(index_1.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore decrypted files from pristine test sample files
        fs_1.default.writeFileSync(index_1.DEFAULT_DECRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
        fs_1.default.writeFileSync(CUSTOM_DECRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
    });
    afterEach(() => {
        removeFile(index_1.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(index_1.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });
    it(`should encrypt default decrypted file ${index_1.DEFAULT_DECRYPTED_FILE} into default encrypted file ${index_1.DEFAULT_ENCRYPTED_FILE}`, () => {
        (0, index_1.encrypt)({ passwd: ENC_PASSWD, decryptedFile: index_1.DEFAULT_DECRYPTED_FILE, encryptedFile: index_1.DEFAULT_ENCRYPTED_FILE });
        (0, chai_1.expect)((0, index_1.decrypt)({ passwd: ENC_PASSWD, encryptedFile: index_1.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
    it(`should encrypt default decrypted file ${index_1.DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, () => {
        (0, index_1.encrypt)({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)((0, index_1.decrypt)({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${index_1.DEFAULT_ENCRYPTED_FILE}`, () => {
        (0, index_1.encrypt)({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)((0, index_1.decrypt)({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, () => {
        (0, index_1.encrypt)({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)((0, index_1.decrypt)({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
    it(`should throw Error if empty password is provided and DOTENVENC_PASS is not set`, () => {
        (0, chai_1.expect)(() => (0, index_1.encrypt)({ passwd: '' })).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Encryption requires a password/);
    });
    it(`should throw Error if no password is provided and DOTENVENC_PASS is not set`, () => {
        (0, chai_1.expect)(() => (0, index_1.encrypt)()).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Encryption requires a password/);
    });
    it(`should encrypt default decrypted file with DOTENVENC_PASS if empty password is provided and DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        (0, index_1.encrypt)({ passwd: '' });
        (0, chai_1.expect)((0, index_1.decrypt)({ passwd: process.env.DOTENVENC_PASS, encryptedFile: index_1.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
    it(`should encrypt default decrypted file with DOTENVENC_PASS if no password is provided and DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        (0, index_1.encrypt)();
        (0, chai_1.expect)((0, index_1.decrypt)({ passwd: process.env.DOTENVENC_PASS, encryptedFile: index_1.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
});
describe('decryption', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(index_1.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(index_1.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore encrypted files from pristine sample
        fs_1.default.writeFileSync(index_1.DEFAULT_ENCRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
        fs_1.default.writeFileSync(CUSTOM_ENCRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
    });
    afterEach(() => {
        removeFile(index_1.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(index_1.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });
    it(`should decrypt default encrypted file ${index_1.DEFAULT_ENCRYPTED_FILE} correctly`, () => {
        const data = (0, index_1.decrypt)({ passwd: ENC_PASSWD, encryptedFile: index_1.DEFAULT_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('multi\nline');
        (0, chai_1.expect)(process.env.DELTA).to.equal('1234');
    });
    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} correctly`, () => {
        const data = (0, index_1.decrypt)({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('multi\nline');
        (0, chai_1.expect)(process.env.DELTA).to.equal('1234');
    });
    it(`should decrypt default encrypted file ${index_1.DEFAULT_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = (0, index_1.decrypt)({ passwd: '' });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('multi\nline');
        (0, chai_1.expect)(process.env.DELTA).to.equal('1234');
    });
    it(`should decrypt default encrypted file ${index_1.DEFAULT_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = (0, index_1.decrypt)();
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('multi\nline');
        (0, chai_1.expect)(process.env.DELTA).to.equal('1234');
    });
    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if empty password is provided by DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = (0, index_1.decrypt)({ passwd: '', encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('multi\nline');
        (0, chai_1.expect)(process.env.DELTA).to.equal('1234');
    });
    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if no password is provided by DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = (0, index_1.decrypt)({ encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        (0, chai_1.expect)(process.env.ALPHA).to.equal('bar');
        (0, chai_1.expect)(process.env.BETA).to.equal('foo bar');
        (0, chai_1.expect)(process.env.GAMMA).to.equal('multi\nline');
        (0, chai_1.expect)(process.env.DELTA).to.equal('1234');
    });
    it(`should throw Error if empty password is provided and DOTENVENC_PASS is not set`, () => {
        (0, chai_1.expect)(() => (0, index_1.decrypt)({ passwd: '' })).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Decryption requires a password/);
    });
    it(`should throw Error if no password is provided and DOTENVENC_PASS is not set`, () => {
        (0, chai_1.expect)(() => (0, index_1.decrypt)()).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Decryption requires a password/);
    });
    it(`should throw Error if provided encrypted secrets file does not exist`, () => {
        (0, chai_1.expect)(() => (0, index_1.decrypt)({ passwd: 'doesnotmatter', encryptedFile: '/non/existent/file' })).to.throw(/Encrypted secrets input file "\/non\/existent\/file" not found/);
    });
});
//# sourceMappingURL=dotenvenc.spec.js.map