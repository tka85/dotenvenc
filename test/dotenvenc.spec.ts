const ENC_PASSWD = 'superDuperPassword';
const TEST_SAMPLE_DECRYPTED_FILE = './test/.env.sample';
const TEST_SAMPLE_ENCRYPTED_FILE = './test/.env.enc.sample';
const CUSTOM_DECRYPTED_FILE = './.env.custom';
const CUSTOM_ENCRYPTED_FILE = './.env.enc.custom';

import { encrypt, decrypt, DEFAULT_DECRYPTED_FILE, DEFAULT_ENCRYPTED_FILE } from '../src/index';
import fs from 'fs';
import { expect } from 'chai';

function removeFile(filename) {
    try {
        fs.unlinkSync(filename);
    } catch (err) {
        // file didn't exist; ignore
    }
}

describe('encryption', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore decrypted files from pristine test sample files
        fs.writeFileSync(DEFAULT_DECRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
        fs.writeFileSync(CUSTOM_DECRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
    });

    afterEach(() => {
        removeFile(DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });

    it(`should encrypt default decrypted file ${DEFAULT_DECRYPTED_FILE} into default encrypted file ${DEFAULT_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, decryptedFile: DEFAULT_DECRYPTED_FILE, encryptedFile: DEFAULT_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });

    it(`should encrypt default decrypted file ${DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });

    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${DEFAULT_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });

    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });

    it(`should throw Error if empty password is provided and DOTENVENC_PASS is not set`, () => {
        expect(() => encrypt({ passwd: '' })).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Encryption requires a password/);
    });

    it(`should throw Error if no password is provided and DOTENVENC_PASS is not set`, () => {
        expect(() => encrypt()).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Encryption requires a password/);
    });

    it(`should encrypt default decrypted file with DOTENVENC_PASS if empty password is provided and DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        encrypt({ passwd: '' });
        expect(decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });

    it(`should encrypt default decrypted file with DOTENVENC_PASS if no password is provided and DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        encrypt();
        expect(decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
    });
});

describe('decryption', () => {
    beforeEach(() => {
        delete process.env.DOTENVENC_PASS;
        removeFile(DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore encrypted files from pristine sample
        fs.writeFileSync(DEFAULT_ENCRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
        fs.writeFileSync(CUSTOM_ENCRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
    });

    afterEach(() => {
        removeFile(DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} correctly`, () => {
        const data = decrypt({ passwd: ENC_PASSWD, encryptedFile: DEFAULT_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('multi\nline');
        expect(process.env.DELTA).to.equal('1234');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} correctly`, () => {
        const data = decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('multi\nline');
        expect(process.env.DELTA).to.equal('1234');
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ passwd: '' });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('multi\nline');
        expect(process.env.DELTA).to.equal('1234');
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt();
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('multi\nline');
        expect(process.env.DELTA).to.equal('1234');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if empty password is provided by DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ passwd: '', encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('multi\nline');
        expect(process.env.DELTA).to.equal('1234');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if no password is provided by DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: 'multi\nline', DELTA: '1234' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('multi\nline');
        expect(process.env.DELTA).to.equal('1234');
    });

    it(`should throw Error if empty password is provided and DOTENVENC_PASS is not set`, () => {
        expect(() => decrypt({ passwd: '' })).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Decryption requires a password/);
    });

    it(`should throw Error if no password is provided and DOTENVENC_PASS is not set`, () => {
        expect(() => decrypt()).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Decryption requires a password/);
    });

    it(`should throw Error if provided encrypted secrets file does not exist`, () => {
        expect(() => decrypt({ passwd: 'doesnotmatter', encryptedFile: '/non/existent/file' })).to.throw(/Encrypted secrets input file "\/non\/existent\/file" not found/);
    });
});


