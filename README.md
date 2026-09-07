# @tka85/dotenvenc

**NOTE**: *This is an improved version of the now deprecated [dotenvenc](https://www.npmjs.com/package/dotenvenc).*

Are you using `.env` and it contains secrets like passwords & tokens?

And are you using [`dotenv`](https://www.npmjs.com/package/dotenv) to expose those secrets as `process.env` variables to your app?

**Problem**: you are exposing the secrets in plain text in your repository and your production system.

**Solution**: you can now save your `.env` encrypted as `.env.enc`, then decrypt it during runtime only in memory (never on disk) and transparently get the same functionality as you enjoyed from `dotenv`.

---

## ⚠️ Upgrading to v6

**v6 is a breaking release. Every `.env.enc` and `.env.enc.readable` created by v5 or earlier must be regenerated.** There is no automatic migration: v6 cannot read the old format, and it will tell you so rather than fail obscurely.

While you still have v5 installed, dump your secrets back to a plaintext `.env`:

```bash
# with v5 still installed
./node_modules/.bin/dotenvenc -d > .env
```

Then upgrade and re-encrypt:

```bash
npm i @tka85/dotenvenc@^6
./node_modules/.bin/dotenvenc -e
```

If you skipped that and only have the old encrypted file, `npm i @tka85/dotenvenc@5` temporarily to recover it.

### Everything that changed in v6

| Change | What it means for you |
| --- | --- |
| Encryption is now **AES-256-GCM** instead of AES-256-CTR | Old files unreadable. Tampering with a committed `.env.enc` is now detected. |
| Keys are derived with **scrypt** over a random per-file salt, instead of using the password directly | Old files unreadable. Adds ~65 ms per encrypt/decrypt call. |
| Encrypted files carry a **format version tag** | Old files unreadable, but future parameter changes will no longer break your files. |
| `.readable` is now `{ version, salt, digests }` and its digests are keyed differently | Regenerate it; all digests change once, then stay stable. |
| Passwords must be **at least 8 characters** when encrypting | Short passwords are rejected at encryption time. Decryption is unaffected. |
| Empty passwords are rejected | Previously an empty password silently produced an all-zeros key. |
| `-d` prints **quoted** values: `ALPHA='bar'` | Output still parses as a `.env`; anything grepping the raw text sees quotes. |
| `-x` quotes with single quotes | Values are no longer interpreted by the shell. |
| Informational messages and the password prompt moved to **stderr** | `eval $(dotenvenc -x)` now works. Scripts capturing stdout get only secrets. |
| A wrong invocation exits **1** instead of 0 | Scripts can detect failure. `-h` still exits 0. |
| `encryptValuesOnly()` is now `async` | `await` it if you call it directly. |
| Requires **Node.js >= 18** | Declared in `engines`. |
| `ts-node` and `debug` are no longer runtime dependencies | Install drops from 26 packages to 5. |

## Benefits

* **Authenticated encryption**
  ✔ AES-256-GCM. If anyone alters your committed `.env.enc`, decryption fails loudly instead of silently handing your app rewritten secrets.
* **Real key derivation**
  ✔ scrypt (N=32768, r=8, p=1) over a random 16-byte per-file salt, so guessing a password is expensive and work cannot be shared across files.
* **Secrets stay in memory**
  ✔ Your secrets exist unencrypted only in memory during runtime; never on disk.
* **Handy CLI**
  ✔ Comes with the `dotenvenc` script for updating your `.env.enc` from your local (uncommitted) `.env`.
* **Lean**
  ✔ Three runtime dependencies.
* **Easy**
  ✔ Transition from `dotenv` replacing a single line of code.
* **Flexible**
  ✔ Not limited to `.env` and `.env.enc`; you can set any custom filenames.

## What this protects against, and what it does not

**It protects against** someone reading your repository, or your published package, and learning your secrets. It also protects against someone *modifying* a committed `.env.enc` to change what your app reads at runtime.

**It does not protect against** an attacker who has the password. In particular, the README's convenient option below, `DOTENVENC_PASS` in your `.bashrc`, means anyone who can read your shell profile can read your secrets. That is a real but narrow benefit over a gitignored `.env`.

**It has no key rotation story.** One password is shared by everyone who needs the secrets, every past ciphertext stays in git history, there is no per-user access and no revocation. When somebody leaves the team you must rotate every secret, and the history remains decryptable with the password they still know. If you need per-recipient keys and revocation, use [`sops`](https://github.com/getsops/sops) with [`age`](https://github.com/FiloSottile/age), or a hosted secrets manager. This tool is a good fit for solo developers and small trusted teams.

## Tip

Add `.env` in your `.gitignore` so your unencrypted secrets are guaranteed to never get committed in your codebase.

## Installation

```bash
npm i @tka85/dotenvenc
```

## Encryption

You have a `.env` (or custom-named unencrypted secrets file) and you will generate a `.env.enc` (or custom-named file) which is encrypted and safe to commit.

You can use the handy command-line script `dotenvenc` that comes installed with the package. Run it with `-h` to see the help page.

### Step 1 (optional)

#### Convenient option

Save the encryption/decryption password you will be using in the environment variable `DOTENVENC_PASS` in your `.bashrc` (or `.bash_profile`):

```bash
export DOTENVENC_PASS='mySuperDuperPassword';
```

and reload it:

```bash
source ~/.bashrc
```

Upon runtime your app will use this env variable when reading the encrypted `.env.enc` to decrypt it and populate your `process.env` (see following section `Decryption` on how to do this).

But setting this env variable is also helpful for the CLI tool `dotenvenc`. If `DOTENVENC_PASS` is set, the `dotenvenc` script will not prompt you each time to type the password for encryption/decryption.

Note the tradeoff described in [What this protects against](#what-this-protects-against-and-what-it-does-not): a password sitting in your shell profile is readable by anything that can read your shell profile.

#### Secure option

For maximum security, do not save the `DOTENVENC_PASS` not even as an environment variable in your `.bashrc`. If it is not set, the application will ask for it upon startup before it can proceed to decrypt `.env.enc` and populate your `process.env`.

### Step 2: encrypt .env

Note: you will have to repeat this step each time you make changes to a secret in your unencrypted `.env` and need to reflect it into the encrypted `.env.enc`.

If your unencrypted secrets file is `.env` and resides at the root of the project, then simply:

```bash
./node_modules/.bin/dotenvenc -e
```

will prompt you (x2) for an encryption password (unless `DOTENVENC_PASS` is set) and proceed to generate an encrypted secrets file `.env.enc`. The password must be at least 8 characters.

Optionally you can also generate the semi-readable `.readable` file passing `-r` additionally to `-e`:

```bash
./node_modules/.bin/dotenvenc -e -r
```

And if your unencrypted secrets file is not named the default `.env`, we have you covered:

```bash
./node_modules/.bin/dotenvenc -e -i /path/to/my/secrets-env-filename
```

And if you don't want to name the encrypted secrets file `.env.enc`, we also have you covered:

```bash
./node_modules/.bin/dotenvenc -e -i /path/to/my/secrets-env-filename -o /another/place/to/my/encrypted-secrets-env-filename
```

## Decryption

Let's assume the contents of the `.env` that you encrypted into `.env.enc` are:

```text
DB_PASS='superDuperPassword'
SECRET_TOKEN='noMoreSecrets'
```

For all possible decryption scenarios that follow, the principle is:

* If you have set env var `DOTENVENC_PASS`, no additional step is needed
* If you have not set env var `DOTENVENC_PASS`, you will be prompted to supply the decryption password before proceeding

You can now populate the `process.env` in your app's code as follows:

```javascript
require('@tka85/dotenvenc').decrypt();
// From here on your app will have access to the secrets through `process.env.DB_PASS` and `process.env.SECRET_TOKEN`
```

or in ES6:

```javascript
import { decrypt } from '@tka85/dotenvenc';
await decrypt();
// From here on your app will have access to the secrets through `process.env.DB_PASS` and `process.env.SECRET_TOKEN`
```

If you used a custom encrypted filename:

```javascript
import { decrypt } from '@tka85/dotenvenc';
await decrypt({ encryptedFile: './somewhere/.secrets.custom.enc' });
```

`decrypt()` returns a promise. It resolves to the parsed variables and also assigns them onto `process.env`; if it rejects, the file was missing, malformed, tampered with, or the password was wrong.

## Recovery of unencrypted secrets file

You want to decrypt and view the contents of your encrypted secrets file?
A new team member wants to recreate the `.env` upon checkout of the project? (remember that `.env` is an unversioned file)
Or you want to recreate the `.env` because it got lost or corrupted?

Using the script's `-d` flag:

```bash
./node_modules/.bin/dotenvenc -d
```

or if you used a custom name instead of the default `.env.enc`:

```bash
./node_modules/.bin/dotenvenc -d -i ./somewhere/.secrets.custom.enc
```

The contents are printed as valid `.env` syntax, with each value quoted so it survives being read back:

```
VAR1='VALUE1'
VAR2='VALUE2'
```

Because informational messages go to stderr, redirecting stdout gives you a usable file directly:

```bash
./node_modules/.bin/dotenvenc -d > .env
```

Values are quoted with whichever quote character they do not themselves contain, so multi-line secrets (a PEM private key, for instance) and values containing quotes round-trip intact. A value that manages to contain every quote character cannot be represented and is skipped with a warning on stderr.

## Bonus

You can dump the contents of your encrypted secrets file as shell `export` statements.

Using the script's `-x` flag:

```bash
./node_modules/.bin/dotenvenc -x -i ./somewhere/.secrets.custom.enc
```

This will print on stdout:

```
export VAR1='VALUE1';
export VAR2='VALUE2';
```

### How is that useful?

Using the shell's `eval` in a shell script you can populate your environment dynamically without ever storing the sensitive information on disk.

```bash
eval "$(./node_modules/.bin/dotenvenc -x)"
# all commands following in the script will now have access to the env variables
```

Values are wrapped in single quotes, the one shell quoting context in which no character is special, so a secret containing `$(...)`, a backtick, `$VAR` or `;` is passed through as literal text and never executed. Variable names that are not valid shell identifiers (dotenv permits `.` and `-` in names, the shell does not) are skipped with a warning on stderr rather than emitted as a syntax error that would abort your `eval`.

## The `.readable` companion file

Passing `-r` alongside `-e` also writes `.env.enc.readable` (or `<your-file>.readable`). It lists your variable **names** in the clear and their **values as keyed digests**:

```json
{
  "version": "v2",
  "salt": "55bb45e020d10f47dc35dd6e7f9dca2b",
  "digests": {
    "ALPHA": "061a14a72df7f11753c1d95a3e1d94e8ce0aed718dcae87e172fce38b1d114a1",
    "BETA": "3f8e6aa7d271d8aa094ee2a3c49e515e3b37a8942a9c16fbd38ba768fa56c7bf"
  }
}
```

The point is diffability: regenerating it shows you at a glance which entries changed. The salt is stored in the file and reused on every regeneration, so an unchanged value keeps its digest forever, and a changed one visibly changes.

### CAUTION

This file leaks your variable **names**, so do not commit it if the names themselves are sensitive.

The values are digests keyed by a scrypt-derived key, not by your password. In v5 and earlier the HMAC key *was* the password, which made this file an offline oracle: anyone who could guess a single value, and `.env` files are full of guessable ones like a port number or `true`, could test password candidates at one cheap hash each and recover the master password. That is fixed; testing a candidate now costs a full scrypt evaluation, the same as attacking `.env.enc` directly. A weak password is still a weak password.

## Command line reference

```
-e, --encrypt    encrypt an unencrypted .env file and write the encrypted file to disk
-d, --decrypt    decrypt an encrypted .env.enc file and print its contents
-i, --input      the input file; when decrypting the encrypted file (default "./.env.enc"),
                 when encrypting the decrypted file (default "./.env")
-o, --output     [encrypting only] the resulting encrypted file (default "./.env.enc")
-x, --export     dump the contents of an encrypted .env.enc as "export" statements
-r, --readable   also write a .readable digest file when encrypting
-s, --silent     do not print informational messages; errors and warnings are still shown
-v, --version    print the installed version and exit
-h, --help       print this help
```

Set `DOTENVENC_DEBUG=1` to get a full stack trace alongside the error message; without it,
failures are reported as a single line.

### Output streams and exit codes

| | stdout | stderr | exit code |
| --- | --- | --- | --- |
| `-d`, `-x` | the secrets | informational messages, warnings | 0 |
| `-e` | nothing | informational messages, warnings | 0 |
| `-h` | help text | nothing | 0 |
| `-v` | version number | nothing | 0 |
| wrong invocation | nothing | error + help text | 1 |
| any failure | nothing | a one-line `Error: ...` message | 1 |

Only ever the requested secrets go to stdout, so redirecting or capturing stdout is always safe. `-s` silences the informational messages on stderr but never errors or warnings.

## File format

```
v2:<salt>:<iv>:<authTag>:<ciphertext>
```

All fields after the version tag are hex. `v2` denotes AES-256-GCM with a 12-byte IV and a 16-byte authentication tag, keyed by scrypt (N=32768, r=8, p=1) over a 16-byte salt.

The version tag exists so cost parameters can be raised in future without invalidating your files: a new tag will be added and used for new files, while older tags keep decrypting. A file whose tag this version does not recognise reports that you need to upgrade, rather than failing as a wrong password.

## Comments

Anything following a `#` sign in the `.env` file is stripped. That means you can have full line comments:

```
# the whole line is a comment because it starts with a "#"
```

or inline comments:

```
VAR="a value" # text before the "#" is kept; text following the "#" is stripped
```

## Known limitations

* **`decrypt()` overrides existing environment variables.** Unlike `dotenv.config()`, which leaves an already-set `process.env` entry alone, `decrypt()` assigns over it. On a platform that injects configuration into the environment (Heroku, ECS, Kubernetes), the values in your committed file win. Be aware of this if you rely on platform-level overrides.
* **Running the test suite deletes `./.env`** in the project root. This affects contributors to this repository, not users of the package.
* **Comments in your `.env` are encrypted along with the secrets**, so they are not visible in `.env.enc`, but they are recovered by `-d`.

## Inspired by

* [Keeping passwords in source control](http://ejohn.org/blog/keeping-passwords-in-source-control/)
* [envenc](https://www.npmjs.com/package/envenc)
* Based on the now deprecated [dotenvenc](https://www.npmjs.com/package/dotenvenc)
