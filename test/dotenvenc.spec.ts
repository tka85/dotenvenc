const ENC_PASSWD = 'superDuperPassword';
const WRONG_ENC_PASSWD = 'wrong-password';
const TEST_SAMPLE_DECRYPTED_FILE = './test/.env.sample';
const TEST_SAMPLE_ENCRYPTED_FILE = './test/.env.sample.enc';
const CUSTOM_DECRYPTED_FILE = './.env.custom';
const CUSTOM_ENCRYPTED_FILE = './.env.enc.custom';


const rewire = require("rewire");
const dotenvenc = rewire('../src/index');
import fs from 'fs';
import { expect } from 'chai';
import * as sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

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
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore decrypted files from pristine test sample files
        fs.writeFileSync(dotenvenc.DEFAULT_DECRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
        fs.writeFileSync(CUSTOM_DECRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
    });

    afterEach(() => {
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });

    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: dotenvenc.DEFAULT_DECRYPTED_FILE, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE });
        expect(await await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
    });

    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(await await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
    });

    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(await await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
    });

    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(await await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
    });

    it(`should prompt for password if provided empty password and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.encrypt({ passwd: '' });
        expect(promptPasswordSpy.calledOnceWith(true)).to.equal(true);
        revert();
    });

    it(`should prompt for password if no password is provided and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.encrypt();
        expect(promptPasswordSpy.calledOnceWith(true)).to.equal(true);
        revert();
    });

    it(`should encrypt default decrypted file with DOTENVENC_PASS if empty password is provided and DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        await dotenvenc.encrypt({ passwd: '' });
        expect(await await dotenvenc.decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
    });

    it(`should encrypt default decrypted file with DOTENVENC_PASS if no password is provided and DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        await dotenvenc.encrypt();
        expect(await await dotenvenc.decrypt({ passwd: process.env.DOTENVENC_PASS, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
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
        fs.writeFileSync(dotenvenc.DEFAULT_ENCRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
        fs.writeFileSync(CUSTOM_ENCRYPTED_FILE, fs.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
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
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} correctly if DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt();
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} correctly`, async () => {
        const data = await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ passwd: '' });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should decrypt default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt();
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if empty password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ passwd: '', encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should decrypt custom encrypted file ${CUSTOM_ENCRYPTED_FILE} if no password is provided but DOTENVENC_PASS is set`, async () => {
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ encryptedFile: CUSTOM_ENCRYPTED_FILE });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
    });

    it(`should prompt for password if provided empty password and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.decrypt({ passwd: '' });
        expect(promptPasswordSpy.calledOnceWith(false)).to.equal(true);
        revert();
    });

    it(`should prompt for password if no password is provided and DOTENVENC_PASS is not set`, async () => {
        const promptPasswordSpy = sinon.spy();
        const revert = dotenvenc.__set__('promptPassword', async (askConfirmation) => {
            promptPasswordSpy(askConfirmation);
            return Promise.resolve(ENC_PASSWD);
        });
        await dotenvenc.decrypt();
        expect(promptPasswordSpy.calledOnceWith(false)).to.equal(true);
        revert();
    });

    it(`should throw error if wrong decryption password is supplied`, async () => {
        await expect(dotenvenc.decrypt({ passwd: WRONG_ENC_PASSWD })).to.be.rejectedWith(/Restored no env variables. Either empty input file or wrong password./);
    });

    it(`should throw Error if provided encrypted secrets file does not exist`, async () => {
        await expect(dotenvenc.decrypt({ passwd: 'doesnotmatter', encryptedFile: '/non/existent/file' })).to.be.rejectedWith(/Encrypted secrets input file "\/non\/existent\/file" not found/);
    });

    it(`should console.log() decrypted env vars if passed "print: true"`, async () => {
        const logSpy = sinon.spy(console, 'log');
        process.env.DOTENVENC_PASS = ENC_PASSWD;
        const data = await dotenvenc.decrypt({ print: true });
        expect(data).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', EPSILON: 'bla' });
        expect(process.env.ALPHA).to.equal('bar');
        expect(process.env.BETA).to.equal('foo bar');
        expect(process.env.GAMMA).to.equal('1234');
        expect(process.env.DELTA).to.equal('With \"double quotes\" inside');
        expect(process.env.EPSILON).to.equal('bla');
        expect(logSpy.callCount).to.equal(5);
        expect(logSpy.getCall(0).args[0]).to.equal('export ALPHA="bar";');
        expect(logSpy.getCall(1).args[0]).to.equal('export BETA="foo bar";');
        expect(logSpy.getCall(2).args[0]).to.equal('export GAMMA="1234";');
        expect(logSpy.getCall(3).args[0]).to.equal('export DELTA="With \\"double quotes\\" inside";');
        expect(logSpy.getCall(4).args[0]).to.equal('export EPSILON="bla";');
    });
});
