#!/usr/bin/env ts-node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pug from 'pug'
import TurndownService from 'turndown'
import chapters from './meta/chapters.json'
import yaml from 'yaml'
import type { ChapterMeta } from '../schemas'

convertFromJson()

function convertFromJson() {
  for (const chapter of chapters) {
    const { index, slug } = chapter

    const inputPath = `pug-to-md/views/chapters/${slug}.pug`

    // if (index >= 286) {
    //   inputPath = `pug-to-md/views/${ slug }.pug`
    // }

    const outputPath = `content/${index.toString().padStart(3, '0')}.${slug}.md`

    // if (index >= 286) {
    //   outputPath = `content/${ slug }.md`
    // }

    convertPugToMarkdown(getChapterMeta(chapter), inputPath, outputPath)
  }
}

function getChapterMeta(chapter: typeof chapters[0]) {
  const { links } = chapter

  const slugLinks = links.map((link) => {
    return { ...link, to: getSlugFromIndex(link.to) }
  })

  return { ...chapter, links: slugLinks }
}

function getSlugFromIndex(index: number) {
  const chapter = chapters[index]
  if (!chapter) throw new Error(`Chapter "${index}" not found`)
  return chapter.slug
}

function convertPugToMarkdown(chapter: ChapterMeta, inputPath: string, outputPath?: string) {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  /**
   * Render Pug to HTML.
   *
   * This will respect `extends` and `block` directives if your
   * Pug template is part of a larger layout.
   */
  let html: string
  try {
    html = pug.renderFile(inputPath, {
      // allow `extends ../../templates/layout` and similar to resolve
      basedir: path.dirname(inputPath),
      filename: inputPath
    })
  } catch (err) {
    console.error('Error while rendering Pug to HTML:')
    console.error(err)
    process.exit(1)
  }

  /**
   * Set up Turndown (HTML → Markdown)
   */
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
  })

  turndownService.addRule('noTitle', {
    filter: 'title',
    replacement: () => ''
  })

  let h2Count = 0
  turndownService.addRule('h2AsH1', {
    filter: 'h2',
    replacement: function (content) {
      if (chapter.articlesCount === 1) return ''
      let output = ''
      if (h2Count !== 0) output += '\n\n---'
      output += `\n\n ## ${content} \n\n`
      h2Count++
      return output
    }
  })

  /**
   * Custom rule for span.small-caps:
   *
   *    <span class="small-caps">Some text</span>
   * →  :small-caps[Some text]
   */
  turndownService.addRule('smallCapsSpan', {
    filter: (node: HTMLElement) => {
      if (!node || node.nodeName !== 'SPAN') return false

      const classAttr
        = (node.getAttribute && node.getAttribute('class')) || ''
      const classes = classAttr.split(/\s+/).filter(Boolean)
      return classes.includes('small-caps')
    },
    replacement: (content: string) => {
      // Trim to avoid weird spaces like ":small-caps[  Text  ]"
      const inner = content.trim()
      return `[${inner}]{.small-caps}`
    }
  })

  /**
   * Custom rule for p.poetry:
   *
   *    <p class="poetry">Some text</p>
   * →  ::lexikon-poetry
   *    [Some text]
   *    ::
   */
  turndownService.addRule('poetryParagraph', {
    filter: (node: HTMLElement) => {
      if (!node || node.nodeName !== 'P') return false

      const classAttr
        = (node.getAttribute && node.getAttribute('class')) || ''
      const classes = classAttr.split(/\s+/).filter(Boolean)
      return classes.includes('poetry')
    },
    replacement: (content: string) => {
      // Trim to avoid weird spaces like ":small-caps[  Text  ]"
      const inner = content.trim()
      return `::lexikon-poetry

${inner}
    
::`
    }
  })

  /*
   * Optional: you *could* add a rule for a.arrow, but Turndown already
   * converts <a> to Markdown links of the form [text](href), which is
   * exactly what we want.
   *
   * So we just rely on the default behavior for links.
   * If you ever want to special-case it, you could do:
   */

  turndownService.addRule('arrowLinks', {
    filter: (node: HTMLElement) => {
      if (!node || node.nodeName !== 'A') return false
      const classAttr
        = (node.getAttribute && node.getAttribute('class')) || ''
      const classes = classAttr.split(/\s+/).filter(Boolean)
      return classes.includes('arrow')
    },
    replacement: (content: string, node: HTMLElement) => {
      const href = node.getAttribute('href')?.replace('.html', '') || ''
      const text = content.trim() || href
      return `[${text}](${href}){.arrow-link}`
    }
  })

  turndownService.addRule('smallCapsLinks', {
    filter: (node: HTMLElement) => {
      if (!node || node.nodeName !== 'A') return false
      const classAttr
        = (node.getAttribute && node.getAttribute('class')) || ''
      const classes = classAttr.split(/\s+/).filter(Boolean)
      return classes.includes('small-caps')
    },
    replacement: (content: string, node: HTMLElement) => {
      const href = node.getAttribute('href')?.replace('.html', '') || ''
      const text = content.trim() || href
      return `[${text}](${href}){.small-caps}`
    }
  })

  /**
   * Convert HTML → Markdown
   */
  let markdown: string

  try {
    markdown = '---\n'
    markdown += yaml.stringify(chapter)
    markdown += '---\n\n'
    if (!chapter.titleEndsWithPeriod) markdown += chapter.title + ' '
    markdown += turndownService.turndown(html)
  } catch (err) {
    console.error('Error while converting HTML to Markdown:')
    console.error(err)
    process.exit(1)
  }

  /**
   * Output result
   */
  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, markdown, 'utf8')
      console.log(`File written: ${outputPath}`)
    } catch (err) {
      console.error(`Failed to write output file: ${outputPath}`)
      console.error(err)
      process.exit(1)
    }
  } else {
    // Write to stdout
    process.stdout.write(markdown + '\n')
  }
}
