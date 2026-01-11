/**
 * @see https://prettier.io/docs/configuration
 * @type {import('prettier').Config}
 */

module.exports = {
    trailingComma: 'none',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    plugins: ['@prettier/plugin-hermes']
}
