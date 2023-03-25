module.export = {
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "tsconfigRootDir": "./",
        "project": "./tsconfig.eslint.json"
    },
    "rules": {
        "import/no-unresolved": [2, { "caseSensitive": false }],
        "@typescript-eslint/camelcase": 0,
        "import/no-absolute-path": 0,
        "import/first": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "object-shorthand": 0,
        "max-len": ["off"]
    },
    "overrides": [{
        "files": [ "test/**/*" ],
        "rules": {
            "no-console": 0
        }
    }],
    "env": {
        "es2020": true,
    }
}