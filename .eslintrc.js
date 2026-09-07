module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.eslint.jsonc',
        sourceType: 'module',
        ecmaVersion: 2021,
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
    ],
    env: {
        node: true,
        es2021: true,
    },
    settings: {
        'import/resolver': {
            node: { extensions: ['.js', '.ts'] },
        },
    },
    rules: {
        'import/no-unresolved': [2, { caseSensitive: false }],
        'import/no-absolute-path': 0,
        'import/first': 0,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        // this codebase deliberately awaits every promise it creates; a floating one
        // in the CLI would swallow an error and exit 0
        '@typescript-eslint/no-floating-promises': 'error',
        'object-shorthand': 0,
        'max-len': 'off',
    },
    overrides: [
        {
            files: ['test/**/*'],
            rules: { 'no-console': 0 },
        },
    ],
    // .eslintrc.js itself is not part of the TS program, and dist is generated
    ignorePatterns: ['dist/', 'node_modules/', '.eslintrc.js'],
};
