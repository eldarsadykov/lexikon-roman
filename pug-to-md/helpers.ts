import fs from 'node:fs'
import path from 'node:path'

export function writeOutput(text: string, outputPath?: string) {
  if (outputPath) {
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, text, 'utf8')
      console.log(`File written: ${outputPath}`)
    } catch (err) {
      console.error(`Failed to write output file: ${outputPath}`)
      console.error(err)
      process.exit(1)
    }
  } else {
    process.stdout.write(text + '\n')
  }
}
