// TODO: Figure out how to get away from this pattern, and actually find the real type-stubs for these modules
declare module 'crypto' {
    declare module.exports: any
}

declare module 'fs' {
    declare module.exports: any
}

declare module 'path' {
    declare module.exports: any
}
