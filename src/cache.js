// @flow
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const fsp = fs.promises

type FileFingerprint = {
    rel: string,
    size: number,
    mtimeMs: number
}

type Manifest = {
    version: number,
    optionsHash: string,
    files: { [rel: string]: FileFingerprint }
}

type CleanPlan = {|
    manifestPath: string,
    nextManifest: Manifest,
    changed: Array<string>,
    deleted: Array<string>,
    optionsChanged: boolean,
    prevExists: boolean
|}

const MANIFEST_VERSION = 1

async function fileFingerprint(
    absPath: string,
    rel: string
): Promise<FileFingerprint> {
    const st = await fsp.stat(absPath)
    return { rel, size: st.size, mtimeMs: st.mtimeMs }
}

function hashOptions(opts: mixed): string {
    const json = JSON.stringify(opts)
    return crypto.createHash('sha1').update(json).digest('hex')
}

async function readManifest(manifestPath: string): Promise<?Manifest> {
    try {
        const raw = await fsp.readFile(manifestPath, 'utf8')
        const parsed: any = JSON.parse(raw)

        if (parsed && parsed.version === MANIFEST_VERSION) return parsed
        return null
    } catch (e) {
        void e
    }
}

async function writeManifest(
    manifestPath: string,
    manifest: Manifest
): Promise<void> {
    await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
}

async function listSVGFiles(dir: string): Promise<Array<string>> {
    const entries = await fsp.readdir(dir, { withFileTypes: true })
    const out = []

    for (const e of entries) {
        if (!e.isFile()) continue
        if (e.name.toLowerCase().endsWith('.svg')) out.push(e.name)
    }
    return out
}

async function ensureDir(p: string): Promise<void> {
    await fsp.mkdir(p, { recursive: true })
}

async function rimrafDir(p: string): Promise<void> {
    await fsp.rm(p, { recursive: true, force: true })
}

async function copyFile(src: string, dst: string): Promise<void> {
    await ensureDir(path.dirname(dst))
    await fsp.copyFile(src, dst)
}

async function removeIfExists(p: string): Promise<void> {
    try {
        await fsp.unlink(p)
    } catch (e) {
        void e
    }
}

async function planIncrementalClean(
    inputDir: string,
    cleanedDir: string,
    outputDir: string,
    effectiveOptions: Object
): Promise<CleanPlan> {
    const manifestPath = path.join(outputDir, '.manifest.json')
    const prev = await readManifest(manifestPath)

    const optionsHash = hashOptions(effectiveOptions)

    const svgs = await listSVGFiles(inputDir)
    const nextFiles: { [rel: string]: FileFingerprint } = {}
    const changed: Array<string> = []
    const deleted: Array<string> = []

    for (const name of svgs) {
        const abs = path.join(inputDir, name)
        const fp = await fileFingerprint(abs, name)
        nextFiles[name] = fp

        const prevFp = prev?.files?.[name]
        const isSame =
            prevFp && prevFp.size === fp.size && prevFp.mtimeMs === fp.mtimeMs

        if (!isSame) changed.push(name)
    }

    if (prev?.files) {
        for (const rel of Object.keys(prev.files)) {
            if (!nextFiles[rel]) deleted.push(rel)
        }
    }

    const optionsChanged = !prev || prev.optionsHash !== optionsHash

    return {
        manifestPath,
        nextManifest: {
            version: MANIFEST_VERSION,
            optionsHash,
            files: nextFiles
        },
        changed,
        deleted,
        optionsChanged,
        prevExists: !!prev
    }
}

module.exports = {
    ensureDir,
    rimrafDir,
    copyFile,
    removeIfExists,
    planIncrementalClean,
    writeManifest
}
