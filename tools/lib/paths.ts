/**
 * Shared filesystem paths and small loaders used by every build tool.
 */
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import { parse as parseYaml } from 'yaml'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DOCS_DIR = join(ROOT, 'docs')
export const THEME_DIR = join(DOCS_DIR, '.vitepress')
export const GENERATED_DIR = join(THEME_DIR, 'data', 'generated')
export const IMPLEMENTATIONS_DIR = join(ROOT, 'implementations')
export const TEMPLATES_DIR = join(ROOT, 'templates')
export const DATA_DIR = join(ROOT, 'data')
export const DIAGRAMS_DIR = join(ROOT, 'diagrams')
export const TOOLS_DIR = join(ROOT, 'tools')
export const TESTS_DIR = join(ROOT, 'tests')
export const PUBLIC_DIR = join(DOCS_DIR, 'public')

export function rel(from: string, to: string): string {
  return relative(ROOT, to).split('\\').join('/')
}

export function abs(relPath: string): string {
  return join(ROOT, relPath)
}

/* ------------------------------------------------------------------ */
/* YAML / frontmatter loading                                          */
/* ------------------------------------------------------------------ */

export function parseYamlFile<T = unknown>(filePath: string): T {
  return parseYaml(readFileSyncUtf8(filePath)) as T
}

import { readFileSync } from 'node:fs'
function readFileSyncUtf8(p: string): string {
  return readFileSync(p, 'utf8')
}

/**
 * Parse a Markdown file into its YAML frontmatter and body.
 * Returns `null` when the file has no frontmatter block at all.
 */
export function parseMarkdownFrontmatter(
  source: string,
): { data: Record<string, unknown>; body: string } | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) return null
  const data = (parseYaml(match[1] ?? '') ?? {}) as Record<string, unknown>
  return { data, body: source.slice(match[0].length) }
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  const files = await fg(['**/*.md'], { cwd: dir, absolute: true, onlyFiles: true })
  return files.sort()
}

/* ------------------------------------------------------------------ */
/* Small filesystem helpers                                            */
/* ------------------------------------------------------------------ */

export async function readText(path: string): Promise<string> {
  return readFile(path, 'utf8')
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path)
    return true
  } catch {
    return existsSync(path)
  }
}

export async function listDir(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  return (await readdir(dir)).sort()
}

/** Recursively collect every file under `dir` matching `patterns`. */
export async function collectFiles(dir: string, patterns: string[]): Promise<string[]> {
  if (!existsSync(dir)) return []
  const files = await fg(patterns, { cwd: dir, absolute: true, onlyFiles: true })
  return files.sort()
}
