// @flow
const Handlebars = require('handlebars')

// Define custom helper functions here
Handlebars.registerHelper('replaceSeparator', function replaceSeparator(
    stringToSplit: string,
    splitSeparator: string,
    separator: string
): string {
    const parts = String(stringToSplit)
        .split(new RegExp(splitSeparator, 'g'))
        .map((s) => s.replace(/^\s+|\s+$/g, ''))
        .filter((s) => s.length > 0)

    return parts.join(separator)
})

Handlebars.registerHelper('sortedEntries', function sortedEntries(obj) {
    if (obj == null || typeof obj != 'object') return []
    return Object.keys(obj)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, obj[k]])
})

// # TODO: Add helper for stripping size values from the beginning of names (24px_), etc