import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { spawnSync } from 'child_process'

const mediaDir = join(dirname(Bun.main), '../ELEX-Soundscape/media')
const outputDir = join(dirname(Bun.main), 'public/audio')

function deUmlaut(s: string): string {
  return s
    .normalize('NFC')
    // .replace(/ä/g, 'ae')
    // .replace(/ö/g, 'oe')
    // .replace(/ü/g, 'ue')
    // .replace(/Ä/g, 'Ae')
    // .replace(/Ö/g, 'Oe')
    // .replace(/Ü/g, 'Ue')
    // .replace(/ß/g, 'ss')
}

const files = readdirSync(mediaDir).filter(f => f.endsWith('.aiff'))

for (const f of files) {
  const base = f.slice(0, -5)
  const target = deUmlaut(base)
  console.log(`${base} → ${target}`)
  spawnSync('ffmpeg', ['-i', join(mediaDir, f), '-c:a', 'libopus', '-b:a', '192k', join(outputDir, `${target}.opus`), '-y'], { stdio: 'inherit' })
}
