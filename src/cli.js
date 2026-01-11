#!/usr/bin/env node
// @flow

type Args = {
    _: Array<string>,
    help?: boolean,
    config?: string,
    input?: string,
    output?: string,
    name?: string,
    prefix?: string,
    selector?: string,
    tag?: string,
    fontsURL?: string,
    templateCSS?: string,
    in?: string,
    out?: string,
    [key: string]: string | boolean | Array<string> | void
}

type SVGFixerOptions = {
    showProgressBar?: boolean,
    throwIfDestinationDoesNotExist?: boolean
}

type CleanIconsOptions = {
    iconsSrcDir: string,
    iconsCleanedDir: string,
    svgFixerOptions: SVGFixerOptions
}

type GenerateFontsOptions = {
    name: string,
    inputDir: string,
    outputDir: string,
    fontTypes: Array<any>,
    assetTypes: Array<any>,
    fontsUrl: string,
    templates: { css: string },
    normalize: boolean,
    prefix: string,
    selector: string,
    tag: string
}

type ToolConfig = {
    cleanIconsOptions: CleanIconsOptions,
    generateFontsOptions: GenerateFontsOptions
}

const path = require('path')
const minimist = require('minimist')
const iconSVGFixer = require('oslllo-svg-fixer')
const { generateFonts, FontAssetType, OtherAssetType } = require('fantasticon')

// Ensure helpers register at startup (template relies on helpers)
require('./handlebars/helpers')

const {
    ensureDir,
    rimrafDir,
    copyFile,
    removeIfExists,
    planIncrementalClean,
    writeManifest
} = require('./cache')

function requireString(value: mixed, flagName: string): string {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Missing or invalid --${flagName}`)
    }
    return value
}

async function main(): Promise<void> {
    const args: Args = (minimist(process.argv.slice(2), {
        string: [
            'config',
            'input',
            'output',
            'name',
            'prefix',
            'selector',
            'tag',
            'fontsURL',
            'templateCSS'
        ],
        alias: { input: 'in', output: 'out' },
        boolean: ['help'],
        default: {
            prefix: 'i',
            selector: 'icon',
            tag: 'i',
            fontsURL: './'
        }
    }): any)

    if (
        args.help ||
        (!args.config && (!args.input || !args.output || !args.name))
    ) {
        console.log(
            `stroke2font
            
            Usage:
              stroke2font --in <svgDir> --out <outputDir> --name <fontName> [options]
              stroke2font --config <configFile.js>
              
              Options:
                --prefix <prefix>           CSS class prefix (default: "i")
                --selector <selector>       Base selector class (default: "icon")
                --tag <tag>                 Tag to target when selector isn't used (default: "i")
                --fontsURL <directory>      URL in CSS @font-face src (default: "./")
                --templateCSS <file>        Path to css.hbs template (optional)`
        )
        process.exit(0)
    }

    let config: ToolConfig

    if (typeof args.config === 'string') {
        const resolvedConfigFile = path.resolve(process.cwd(), args.config)
        config = (module.require(resolvedConfigFile): any)
    } else {
        const input = requireString(args.input, 'input')
        const output = requireString(args.output, 'output')
        const name = requireString(args.name, 'name')

        const inputDir = path.resolve(process.cwd(), input)
        const outputDir = path.resolve(process.cwd(), output)
        const cleanedDir = path.join(outputDir, '.cleaned-svg')

        const templateCSS =
            typeof args.templateCSS === 'string'
                ? path.resolve(process.cwd(), args.templateCSS)
                : path.resolve(
                      __dirname,
                      './handlebars/templates/default.tp.css.hbs'
                  )

        config = {
            cleanIconsOptions: {
                iconsSrcDir: inputDir,
                iconsCleanedDir: cleanedDir,
                svgFixerOptions: {
                    showProgressBar: true,
                    throwIfDestinationDoesNotExist: false
                }
            },
            generateFontsOptions: {
                name,
                inputDir: cleanedDir,
                outputDir,
                fontTypes: [FontAssetType.WOFF2, FontAssetType.WOFF],
                assetTypes: [OtherAssetType.CSS],
                fontsUrl:
                    typeof args.fontsURL === 'string' ? args.fontsURL : './',
                templates: { css: templateCSS },
                normalize: true,
                prefix: typeof args.prefix === 'string' ? args.prefix : 'i',
                selector:
                    typeof args.selector === 'string' ? args.selector : 'icon',
                tag: typeof args.tag === 'string' ? args.tag : 'i'
            }
        }
    }

    const cleanedDir = config.cleanIconsOptions.iconsCleanedDir
    const inputDir = config.cleanIconsOptions.iconsSrcDir
    const outputDir = config.generateFontsOptions.outputDir

    await ensureDir(cleanedDir)
    await ensureDir(outputDir)

    const effectiveOptions = {
        svgFixerOptions: config.cleanIconsOptions.svgFixerOptions,
        generateFonts: {
            name: config.generateFontsOptions.name,
            prefix: config.generateFontsOptions.prefix,
            selector: config.generateFontsOptions.selector,
            tag: config.generateFontsOptions.tag,
            fontsUrl: config.generateFontsOptions.fontsUrl,
            templates: config.generateFontsOptions.templates,
            normalize: config.generateFontsOptions.normalize,
            fontTypes: config.generateFontsOptions.fontTypes,
            assetTypes: config.generateFontsOptions.assetTypes
        }
    }

    const plan = await planIncrementalClean(
        inputDir,
        cleanedDir,
        outputDir,
        effectiveOptions
    )

    if (
        plan.changed.length === 0 &&
        plan.deleted.length === 0 &&
        !plan.optionsChanged
    ) {
        console.log(
            'No SVG changes detected... skipping clean + font generation'
        )
        return
    }

    for (const rel of plan.deleted) {
        await removeIfExists(path.join(cleanedDir, rel))
    }

    const shouldClean =
        plan.optionsChanged ||
        plan.changed.length > 0 ||
        plan.deleted.length > 0

    if (shouldClean) {
        const tmp = path.join(outputDir, 'tmp-input')
        await rimrafDir(tmp)
        await ensureDir(tmp)

        const toClean = plan.optionsChanged
            ? Object.keys(plan.nextManifest.files)
            : plan.changed

        if (toClean.length > 0) {
            console.log(`Cleaning SVGs (${toClean.length} file(s))...`)
            for (const rel of toClean) {
                await copyFile(path.join(inputDir, rel), path.join(tmp, rel))
            }

            await iconSVGFixer(
                tmp,
                cleanedDir,
                config.cleanIconsOptions.svgFixerOptions
            ).fix()
        } else {
            console.log('No SVGs to clean')
        }

        await rimrafDir(tmp)
    }

    console.log('Generating font(s)...')
    const results = await generateFonts({
        ...config.generateFontsOptions,
        inputDir: cleanedDir
    })
    console.log(results)

    await writeManifest(plan.manifestPath, plan.nextManifest)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
