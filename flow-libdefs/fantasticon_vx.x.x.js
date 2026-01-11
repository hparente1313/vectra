declare module 'fantasticon' {
    declare export var FontAssetType: any
    declare export var OtherAssetType: any

    declare export type GenerateFontsOptions = { [string]: mixed }
    declare export var generateFonts: (opts: GenerateFontsOptions) => Promise<mixed>
}