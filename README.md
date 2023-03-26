# @tka85/dotenvenc

**NOTE**: *This is an improved version of the now deprecated [dotenvenc](https://www.npmjs.com/package/dotenvenc).*

Are you using `.env` and it contains secrets like passwords & tokens?

And are you using [`dotenv`](https://www.npmjs.com/package/dotenv) to expose those secrets as `process.env` variables to your app?

**Problem**: you are exposing the secrets in plain text in your repository and your production system.

**Solution**: you can now save your `.env` encrypted as `.env.enc`, then decrypt it during runtime only in memory (never on disk) and transparently get the same functionality as you enjoyed from `dotenv`.

## Benefits

* Secure!
  ✔ You can safely commit into your codebase the encrypted `.env.enc` without compromosing your secrets
* Secure!!
  ✔ Your secrets exist unencrypted only in memory during runtime; never on disk
* Secure!!!
  ✔ Secrets protected with strong encryption (AES-256)
* Handy!
  ✔ Comes with CLI script `dotenvenc` for easily updating your `.env.enc` from your local (uncommitted) `.env`
* Lean!
  ✔ Still maintain a single dependency but now on `dotenvenc` instead of `dotenv`
* Easy!
  ✔ Transition from `dotenv` replacing a single line of code
* Flexible!
  ✔ Not limited to `.env` and `.env.enc` i.e. you can set any custom filenames for the encrypted and unencrypted files
* Modern!
  ✔ Fully re-written in Typescript

## Tip

Add `.env` in your `.gitignore` so your unencrypted secrets are guaranteed to never get committed in your codebase.

## Installation

```bash
npm i @tka85/dotenvenc
```

## Encryption

You have a `.env` (or custom-named unencrypted secrets file) and you will generate a `.env.enc` (or custom-named file) which is encrypted and safe to commit.

You can use the handy command-line script `dotenvenc` that comes installed with the package. Just run it without arguments to see the help page.

### Step 1

Save the encryption/decryption password you will be using in the environment variable `DOTENVENC_PASS` in your `.bashrc` (or `.bash_profile`):

```bash
export DOTENVENC_PASS='mySuperDuperPassword';
```

and reload it:

```bash
source ~/.bashrc
```

This is mandatory for runtime because your app will use this env variable when reading the encrypted `.env.enc` to decrypt it and populate your `process.env` (see following section `Decryption` on how to do this).

But setting this env variable is also helpful for the CLI tool `dotenvenc`. If `DOTENVENC_PASS` is set, the `dotenvenc` script will not prompt you each time to type the password for encryption/decryption.

### Step 2

Note: you will have to repeat this step each time you make changes to a secret in your unencrypted `.env` and need to reflect it into the encrypted `.env.enc`.

If your unencrypted secrets file is `.env` and resides at the root of the project, then simply:

```bash
./node_modules/.bin/dotenvenc -e
```

will prompt you for an encryption password (unless `DOTENVENC_PASS` is set) and proceed to generate an encrypted secrets file `.env.enc`.

And if your unencrypted secrets file is not named the default `.env`, we have you covered:

```bash
./node_modules/.bin/dotenvenc -e -i /path/to/my/secrets-env-filename
```

will prompt you for an encryption password (unless `DOTENVENC_PASS` is set) and proceed to generate an encrypted secrets file `.env.enc`.

And if you don't want to name the encrypted secrets file `.env.enc`, we also have you covered:

```bash
./node_modules/.bin/dotenvenc -e -i /path/to/my/secrets-env-filename -o /another/place/to/my/encrypted-secrets-env-filename
```

will prompt you for an encryption password (unless `DOTENVENC_PASS` is set) and proceed to generate an encrypted secrets file `/another/place/to/my/encrypted-secrets-env-filename`.

Tip: if you have npm@5.2.0 or better, then you have in your path also [npx](https://www.npmjs.com/package/npx), so the above command is simply:

```bash
npx @tka85/dotenvenc -e ...
```

## Decryption

Let's assume the contents of the `.env` that you encrypted into `.env.enc` are:

```text
DB_PASS='superDuperPassword'
SECRET_TOKEN='noMoreSecrets'
```

You can now populate the `process.env` in your app's code as follows:

```javascript
require('dotenvenc').decrypt({ passwd: 'mySuperDuperPassword'});
// From here on you have access to the secrets through process.env.DB_PASS and process.env.SECRET_TOKEN
```

or in ES6:

```ES6
import { decrypt } from 'dotenvenc';
decrypt({ passwd: 'mySuperDuperPassword'});
// From here on you have access to the secrets through process.env.DB_PASS and process.env.SECRET_TOKEN
```

or if you have set the env variable `DOTENVENC_PASS` simply:

```javascript
require('dotenvenc').decrypt();
// From here on you have access to the secrets through process.env.DB_PASS and process.env.SECRET_TOKEN
```

or in ES6:

```ES6
import { decrypt } from 'dotenvenc';
decrypt();
// From here on you have access to the secrets through process.env.DB_PASS and process.env.SECRET_TOKEN
```

If you used a custom encrypted filename:

```javascript
require('dotenvenc').decrypt({ passwd: 'mySuperDuperPassword', encryptedFile: './somewhere/.secrets.custom.enc'});
// From here on you have access the passwords through process.env.DB_PASS and process.env.CHASTITIY_KEY
```

or in ES6:

```javascript
import { decrypt } from 'dotenvenc';
decrypt({ passwd: 'mySuperDuperPassword', encryptedFile: './somewhere/.secrets.custom.enc'});
// From here on you have access the passwords through process.env.DB_PASS and process.env.CHASTITIY_KEY
```

And again if you have set the env variable `DOTENVENC_PASS` simply:

```javascript
require('dotenvenc').decrypt({encryptedFile: './somewhere/.secrets.custom.enc'});
// From here on you have access the passwords through process.env.DB_PASS and process.env.CHASTITIY_KEY
```

or in ES6:

```javascript
import { decrypt } from 'dotenvenc';
decrypt({encryptedFile: './somewhere/.secrets.custom.enc'});
// From here on you have access the passwords through process.env.DB_PASS and process.env.CHASTITIY_KEY
```

## Bonus

You want to decrypt and view the contents of your encrypted secrets file?

You can use the same handy command-line `dotenvenc` you used to initially encrypt your unencrypted `.env` secrets file.

Using the script's `-d` flag:

```bash
./node_modules/.bin/dotenvenc -d
```

or if you used custom name instead of the default `.env.enc`:

```bash
./node_modules/.bin/dotenvenc -d -i ./somewhere/.secrets.custom.enc
```

In both cases you will be prompted to provide the password that was used to create the encrypted file and, assuming it's correct, you will have the contents printed on the console.

This can be useful if you corrupt or lose your `.env` (remember that `.env` is an unversioned file). With the `dotenvenc` script
you can recreate it to its last functioning state from your `.env.enc`.

## Inspired by

* [Keeping passwords in source control](http://ejohn.org/blog/keeping-passwords-in-source-control/)
* [envenc](https://www.npmjs.com/package/envenc)
* Based on the now deprecated (dotenvenc)[https://www.npmjs.com/package/dotenvenc]()
