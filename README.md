# vectra
A [fantasticon](https://github.com/tancredi/fantasticon) compatible preprocessor 
that converts stroke-based SVG icons into filled glyphs, optimized for incremental 
icon font workflows.

`vectra` solves a common problem in icon pipelines: **stroke-only SVGs don't 
convert cleanly into font glyphs.** This tool normalizes and converts stroke-based 
icons into filled paths *before* handing them off to Fantasticon with caching to 
avoid unnecessary reprocessing.

___

## Why vectra
- ✅ Converts **stroke SVGs → filled glyphs**
- ⚡ **Incremental builds** - only reprocesses changed icons
- 🧠 Smart caching via a manifest file
- 🎨 Customizable Handlebars CSS templates
- 🔌 Drop-in compatible with **fantasticon**
- 🛠 CLI-first, scriptable, zero runtime dependencies

If you're repeatedly regenerating icon fonts during development, this dramatically 
speeds things up.

___

## Installation
```shell
pnpm add -D vectra
# or
npm install --save-dev vectra
```

___

## Usage

### Basic CLI Usage
```shell
 vectra \
  --in ./icons \
  --out ./dist \
  --name my-icons
```

### With a config file
```shell
vectra --config stroke2fill.config.js
```

___

## CLI Options
| **Option**         | **Description**                      | **Default**  |
|--------------------|--------------------------------------|--------------|
| `--input`/`--in`   | Input directory containing SVG icons | **required** |
| `--output`/`--out` | Output directory                     | **required** |
| `--name`           | Font family name                     | **required** |
| `--prefix`         | CSS class prefix                     | `i`          |
| `--selector`       | Base selector class                  | `icon`       |
| `--tag`            | Fallback tag selector                | `i`          |
| `--fontsURL`       | URL used in `@font-face src`         | `./`         |
| `--templateCSS`    | Path to Handlebars CSS template      | built-in     |
| `--config`         | Path to config file                  | -            |
| `--help`           | Show usage                           | -            |

___

## Configuration File
You may optionally provide a configuration file instead of CLI flags.

### `vectra.config.js`
```javascript
module.exports = {
  cleanIconsOptions: {
    iconsSrcDir: './icons',
    iconsCleanedDir: './dist/.vectra-cache',
    svgFixerOptions: {
      showProgressBar: true,
      throwIfDestinationDoesNotExist: false
    }
  },

  generateFontsOptions: {
    name: 'my-icons',
    inputDir: './dist/.vectra-cache',
    outputDir: './dist',
    fontTypes: ['woff2', 'woff'],
    assetTypes: ['css'],
    fontsUrl: './',
    templates: {
      css: './templates/icons.css.hbs'
    },
    normalize: true,
    prefix: 'i',
    selector: 'icon',
    tag: 'i'
  }
}
```

This object is passed directly into Fantasticon after preprocessing.

___

## Templates
`vectra` supports **custom Handlebars CSS templates.**

Two templates ship by default:
- **Minimal** - clean, production-ready output
- **Extended** - utility classes, animations, size helpers

You can provide your own via `--templateCSS`

Helpers available:
- `replaceSeparator`
- `sortedEntries`
- `codepoint`
