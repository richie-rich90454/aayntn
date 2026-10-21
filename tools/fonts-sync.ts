/**
 * Download the self-hosted webfonts used by aayntn and rewrite the Google Fonts
 * stylesheet to point at local copies.
 *
 * Run after changing the font list:  pnpm exec tsx tools/fonts-sync.ts
 *
 * Noto Sans and Noto Sans Mono are variable fonts: Google serves one woff2 per
 * unicode subset that carries the whole weight axis, so we download one file
 * per (family, subset) and declare the supported weight range.
 *
 * Both families are licensed under the SIL Open Font License 1.1; the licence
 * text ships next to the binaries in docs/public/fonts/OFL.txt.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const FONT_DIR = join(ROOT, 'docs', 'public', 'fonts')

const SOURCE_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Mono:wght@400;500&display=swap'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** Only the subsets aayntn actually needs to ship. */
const KEEP_SUBSETS = new Set(['latin', 'latin-ext'])

/** Weight ranges covered by each variable font. */
const WEIGHT_RANGES: Record<string, string> = {
  'Noto Sans': '400 700',
  'Noto Sans Mono': '400 500',
}

async function main() {
  await mkdir(FONT_DIR, { recursive: true })

  const res = await fetch(SOURCE_CSS, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Failed to fetch font CSS: ${res.status}`)
  const css = await res.text()

  const faceRe = /@font-face\s*\{([\s\S]*?)\}/g
  const rules = new Map<string, { family: string; subset: string; remote: string; unicodeRange: string }>()
  let subset = ''
  let face: RegExpExecArray | null

  while ((face = faceRe.exec(css)) !== null) {
    const before = css.slice(0, face.index)
    const open = before.lastIndexOf('/*')
    const close = before.indexOf('*/', open)
    if (open !== -1 && close > open) subset = before.slice(open + 2, close).trim()
    if (!KEEP_SUBSETS.has(subset)) continue

    const body = face[1]!
    const remote = /url\((https:\/\/[^)]+\.woff2)\)/.exec(body)?.[1]
    const family = /font-family:\s*'([^']+)'/.exec(body)?.[1]
    if (!remote || !family) continue

    const unicodeRange = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? ''
    // Variable font: every weight of a subset resolves to the same binary.
    rules.set(`${family}|${subset}`, { family, subset, remote, unicodeRange })
  }

  const faces: string[] = []
  for (const { family, subset: sub, remote, unicodeRange } of rules.values()) {
    const slug = `${family.toLowerCase().replace(/\s+/g, '-')}-${sub}.woff2`
    const bin = await fetch(remote, { headers: { 'User-Agent': UA } })
    if (!bin.ok) throw new Error(`Failed to download ${remote}: ${bin.status}`)
    await writeFile(join(FONT_DIR, slug), Buffer.from(await bin.arrayBuffer()))
    process.stdout.write(`downloaded ${slug}\n`)

    faces.push(
      [
        `/* ${family} — ${sub} */`,
        `@font-face {`,
        `  font-family: '${family}';`,
        `  font-style: normal;`,
        `  font-weight: ${WEIGHT_RANGES[family] ?? '400 700'};`,
        `  font-display: swap;`,
        `  src: url(./${slug}) format('woff2');`,
        unicodeRange ? `  unicode-range: ${unicodeRange};` : '',
        `}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  const header = `/* aayntn self-hosted webfonts.
 * Noto Sans and Noto Sans Mono — SIL Open Font License 1.1.
 * See ./OFL.txt for the full licence text. */
`
  await writeFile(join(FONT_DIR, 'fonts.css'), header + faces.join('\n\n') + '\n', 'utf8')
  process.stdout.write(`wrote ${join(FONT_DIR, 'fonts.css')}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
