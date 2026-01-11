const Handlebars = require('handlebars')

// Define custom helper functions here
Handlebars.registerHelper(
    'replaceSeparator',
    function replaceSeparator(stringToSplit, splitSeparator, separator) {
        const parts = String(stringToSplit)
            .split(new RegExp(splitSeparator, 'g'))
            .map((s) => s.replace(/^\s+|\s+$/g, ''))
            .filter((s) => s.length > 0)
        return parts.join(separator)
    }
)
Handlebars.registerHelper('sortedEntries', function sortedEntries(obj) {
    if (obj == null || typeof obj != 'object') return []
    return Object.keys(obj)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, obj[k]])
})
Handlebars.registerHelper('stripSizePrefix', function stripSizePrefix(value) {
    if (typeof value !== 'string') return ''
    return value.replace(/^\d+(?:[a-zA-Z]+)_+/, '')
})
