import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { spawnSync } from 'child_process'

const mediaDir = join(dirname(Bun.main), '../ELEX-Soundscape/media')
const outputDir = join(dirname(Bun.main), 'app/assets/audio')

const files = readdirSync(mediaDir).filter(f => f.endsWith('.aiff'))

for (const f of files) {
  const base = f.slice(0, -5)
  const target = base.normalize('NFC')
  console.log(`${base} → ${target}`)
  spawnSync('ffmpeg', ['-i', join(mediaDir, f), '-c:a', 'libopus', '-b:a', '192k', join(outputDir, `${target}.opus`), '-y'], { stdio: 'inherit' })
}
