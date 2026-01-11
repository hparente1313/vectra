declare module 'oslllo-svg-fixer' {
    declare export type SVGFixerOptions = {
        showProgressBar?: boolean,
        throwIfDestinationDoesNotExist?: boolean,
        [string]: mixed
    }

    declare export type Fixer = {
        fix: () => Promise<void>
    }

    declare module.exports: (
        iconsSrcDir: string,
        iconsCleanedDir: string,
        svgFixerOptions?: SVGFixerOptions
        ) => Fixer
}