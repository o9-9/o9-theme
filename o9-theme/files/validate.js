#!/usr/bin/env node
/**
 * Validates all theme and icon-theme JSON files referenced in package.json.
 * Reports parse errors and missing files.
 * Exit code: 0 = all valid, 1 = errors found.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

let errors = 0
let checked = 0

function stripJsonComments(src) {
	let result = ''
	let i = 0
	while (i < src.length) {
		if (src[i] === '"') {
			result += src[i++]
			while (i < src.length) {
				if (src[i] === '\\') {
					result += src[i++]
					result += src[i++]
				} else if (src[i] === '"') {
					result += src[i++]
					break
				} else {
					result += src[i++]
				}
			}
		} else if (src[i] === '/' && src[i + 1] === '/') {
			while (i < src.length && src[i] !== '\n') i++
		} else if (src[i] === '/' && src[i + 1] === '*') {
			i += 2
			while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++
			i += 2
		} else {
			result += src[i++]
		}
	}
	return result
}

function check(label, filePath) {
	const abs = resolve(root, filePath)
	if (!existsSync(abs)) {
		console.error(`✗  MISSING   ${filePath}  (${label})`)
		errors++
		return
	}
	try {
		JSON.parse(stripJsonComments(readFileSync(abs, 'utf8')))
		console.log(`✓  OK         ${filePath}`)
		checked++
	} catch (err) {
		console.error(`✗  INVALID   ${filePath}  — ${err.message}`)
		errors++
	}
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

console.log('\n── Color themes ──────────────────────────────────────────')
for (const t of pkg.contributes.themes ?? []) {
	check(t.label, t.path)
}

console.log('\n── Icon themes ───────────────────────────────────────────')
for (const t of pkg.contributes.iconThemes ?? []) {
	check(t.label, t.path)
}

console.log('\n──────────────────────────────────────────────────────────')
if (errors === 0) {
	console.log(`All ${checked} files validated successfully.\n`)
	process.exit(0)
} else {
	console.error(`${errors} error(s) found. Fix them before packaging.\n`)
	process.exit(1)
}
