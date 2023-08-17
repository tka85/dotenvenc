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
const CUSTOM_DECRYPTED_FILE = './.env.custom';
const CUSTOM_ENCRYPTED_FILE = './.env.enc.custom';
const rewire = require("rewire");
const dotenvenc = rewire('../src/index');
const fs_1 = __importDefault(require("fs"));
const chai_1 = require("chai");
const sinon = __importStar(require("sinon"));
const chai_2 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_2.default.use(chai_as_promised_1.default);
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
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
        // Restore decrypted files from pristine test sample files
        fs_1.default.writeFileSync(dotenvenc.DEFAULT_DECRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
        fs_1.default.writeFileSync(CUSTOM_DECRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_DECRYPTED_FILE));
    });
    afterEach(() => {
        removeFile(dotenvenc.DEFAULT_DECRYPTED_FILE);
        removeFile(CUSTOM_DECRYPTED_FILE);
        removeFile(dotenvenc.DEFAULT_ENCRYPTED_FILE);
        removeFile(CUSTOM_ENCRYPTED_FILE);
    });
    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: dotenvenc.DEFAULT_DECRYPTED_FILE, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: dotenvenc.DEFAULT_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt default decrypted file ${dotenvenc.DEFAULT_DECRYPTED_FILE} into custom encrypted file ${CUSTOM_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE });
        (0, chai_1.expect)(await dotenvenc.decrypt({ passwd: ENC_PASSWD, encryptedFile: CUSTOM_ENCRYPTED_FILE })).to.deep.equal({ ALPHA: 'bar', BETA: 'foo bar', GAMMA: '1234', DELTA: 'With \"double quotes\" inside', DELTA_2: 'With \'single quotes\' inside', EPSILON: 'bla', KAPPA: 'multi\nline\nvalue' });
    });
    it(`should encrypt custom decrypted file ${CUSTOM_DECRYPTED_FILE} into default encrypted file ${dotenvenc.DEFAULT_ENCRYPTED_FILE}`, async () => {
        await dotenvenc.encrypt({ passwd: ENC_PASSWD, decryptedFile: CUSTOM_DECRYPTED_FILE, encryptedFile: CUSTOM_ENCRYPTED_FILE });
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
        fs_1.default.writeFileSync(dotenvenc.DEFAULT_ENCRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
        fs_1.default.writeFileSync(CUSTOM_ENCRYPTED_FILE, fs_1.default.readFileSync(TEST_SAMPLE_ENCRYPTED_FILE));
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
        await (0, chai_1.expect)(dotenvenc.decrypt({ passwd: WRONG_ENC_PASSWD })).to.be.rejectedWith(/Restored no env variables. Either empty input file or wrong password./);
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