const ENC_PASSWD = 'superDuperPassword';
const WRONG_ENC_PASSWD = 'wrong-password';
const TEST_SAMPLE_DECRYPTED_FILE = './test/.env.sample';
const TEST_SAMPLE_ENCRYPTED_FILE = './test/.env.sample.enc';
const CUSTOM_DECRYPTED_FILE = './.env.custom';
const CUSTOM_ENCRYPTED_FILE = './.env.enc.custom';

import { encrypt, decrypt, DEFAULT_DECRYPTED_FILE, DEFAULT_ENCRYPTED_FILE } from '../src/index';
import fs from 'fs';
import { expect } from 'chai';
import * as sinon from 'sinon';

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
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
    });

    it(`should encrypt default decrypted file ${DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
    });

    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${DEFAULT_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
    });

    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, () => {
        encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
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
        expect(decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
    });

    it(`should encrypt default decrypted file with DOTENVENC_PASS if no password is provided and DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        encrypt();
        expect(decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
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
        sinon.restore();
        removeFile(DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} correctly if explicitly passed password`, () => {
        const data = decrypt({ passwd: ENC_PASSWD });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} correctly if DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt();
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} correctly`, () => {
        const data = decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ passwd: '' });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should decrypt default encrypted file ${DEFAULT_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt();
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if empty password is provided by DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ passwd: '', encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if no password is provided by DOTENVENC_PASS is set`, () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
    });

    it(`should throw Error if empty password is provided and DOTENVENC_PASS is not set`, () => {
        expect(() => decrypt({ passwd: '' })).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Decryption requires a password/);
    });

    it(`should throw error if wrong password is supplied`, () => {
        expect(() => decrypt({ passwd: WRONG_ENC_PASSWD })).to.throw(/Found no env variables. Either empty input file or wrong password./);
    });

    it(`should throw Error if no password is provided and DOTENVENC_PASS is not set`, () => {
        expect(() => decrypt()).to.throw(/Env variable DOTENVENC_PASS not set and no password provided. Decryption requires a password/);
    });

    it(`should throw Error if provided encrypted secrets file does not exist`, () => {
        expect(() => decrypt({ passwd: 'doesnotmatter', encryptedFile: '/non/existent/file' })).to.throw(/Encrypted secrets input file "\/non\/existent\/file" not found/);
    });

    it(`should console.log() decrypted env vars if passed "print: true"`, () => {
        const logSpy = sinon.spy(console, 'log');
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = decrypt({ print: true });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(logSpy.callCount).to.equal(4);
        expect(logSpy.getCall(0).args[0]).to.equal('ALPHA="bar";');
        expect(logSpy.getCall(1).args[0]).to.equal('BETA="foo bar";');
        expect(logSpy.getCall(2).args[0]).to.equal('GAMMA="1234";');
        expect(logSpy.getCall(3).args[0]).to.equal('DELTA="With \\"double quotes\\" inside";');
    });
});
