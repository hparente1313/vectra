const { defineConfig, globalIgnores } = require('eslint/config')
const eslintConfigPrettier = require('eslint-config-prettier/flat')
const eslintJS = require('@eslint/js')
const { FlatCompat } = require('@eslint/eslintrc')
const hermesParser = require('hermes-eslint')

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: eslintJS.configs.recommended
})

module.exports = defineConfig([
    globalIgnores([
        'node_modules/',
        'dist/',
        'flow-libdefs/',
        'lib/',
        '.cleaned-svg/'
    ]),

    ...compat.extends(
        'eslint:recommended',
        'plugin:ft-flow/recommended',
        'prettier'
    ),

    {
        name: 'stroke2font/base',
        files: ['**/*.js', '**/*.cjs'],
        languageOptions: {
            parser: hermesParser,
            ecmaVersion: 'latest',
            sourceType: 'script'
        },
        rules: {
            'no-console': 'off'
        }
    },
    eslintConfigPrettier
])