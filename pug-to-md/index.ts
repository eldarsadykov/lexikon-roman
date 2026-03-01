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

  return { ...chapter, articleIndex: 1, links: slugLinks }
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

  const isMultiPart = chapter.articlesCount > 1
  const turndownService = createTurndownService(chapter, isMultiPart)

  let markdownBody: string
  try {
    markdownBody = turndownService.turndown(html)
  } catch (err) {
    console.error('Error while converting HTML to Markdown:')
    console.error(err)
    process.exit(1)
  }

  if (!isMultiPart) {
    const markdown = toChapterMarkdown(chapter, markdownBody)
    writeOutput(markdown, outputPath)
    return
  }

  const parts = splitMultipartMarkdown(markdownBody)
  if (parts.length !== chapter.articlesCount) {
    console.warn(
      `Article count mismatch for "${chapter.slug}": expected ${chapter.articlesCount}, found ${parts.length}`
    )
  }

  for (const part of parts) {
    const paddedPart = part.partNumber.toString().padStart(2, '0')
    const chapterDir = `${chapter.index.toString().padStart(3, '0')}.${chapter.slug}`
    const partOutputPath = `content/${chapterDir}/${paddedPart}.md`
    const partChapter = { ...chapter, title: `${chapter.title} ${part.partNumber}`, articleIndex: part.partNumber }
    const markdown = toChapterMarkdown(partChapter, part.markdown)
    writeOutput(markdown, partOutputPath)
  }
}

function splitMultipartMarkdown(markdown: string) {
  const marker = /<<<PART:(\d+)>>>/g
  const matches = [...markdown.matchAll(marker)]
  if (matches.length === 0) return []

  return matches.map((match, index) => {
    const partNumber = Number.parseInt(match[1], 10)
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? markdown.length
    const partMarkdown = markdown.slice(start, end).trim()
    return { partNumber, markdown: partMarkdown }
  })
}

function toChapterMarkdown(chapter: ChapterMeta, body: string) {
  let markdown = '---\n'
  markdown += yaml.stringify(chapter)
  markdown += '---\n\n'
  if (!chapter.titleEndsWithPeriod) markdown += chapter.title + ' '
  markdown += body
  return markdown
}

function writeOutput(markdown: string, outputPath?: string) {
  if (outputPath) {
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, markdown, 'utf8')
      console.log(`File written: ${outputPath}`)
    } catch (err) {
      console.error(`Failed to write output file: ${outputPath}`)
      console.error(err)
      process.exit(1)
    }
  } else {
    process.stdout.write(markdown + '\n')
  }
}

function createTurndownService(chapter: ChapterMeta, isMultiPart: boolean) {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*'
  })

  turndownService.addRule('noTitle', {
    filter: 'title',
    replacement: () => ''
  })

  turndownService.addRule('h2AsH1', {
    filter: 'h2',
    replacement: () => ''
  })

  turndownService.addRule('articlePartMarker', {
    filter: (node: HTMLElement) => {
      if (!isMultiPart || node.nodeName !== 'ARTICLE') return false
      const id = node.getAttribute?.('id') || ''
      return Boolean(getPartNumberFromArticleId(id, chapter.slug))
    },
    replacement: (content: string, node: HTMLElement) => {
      const id = node.getAttribute?.('id') || ''
      const partNumber = getPartNumberFromArticleId(id, chapter.slug)
      if (!partNumber) return content
      return `\n\n<<<PART:${partNumber}>>>\n\n${content}\n`
    }
  })

  turndownService.addRule('smallCapsSpan', {
    filter: (node: HTMLElement) => {
      if (!node || node.nodeName !== 'SPAN') return false

      const classAttr
        = (node.getAttribute && node.getAttribute('class')) || ''
      const classes = classAttr.split(/\s+/).filter(Boolean)
      return classes.includes('small-caps')
    },
    replacement: (content: string) => {
      const inner = content.trim()
      return `[${inner}]{.small-caps}`
    }
  })

  turndownService.addRule('poetryParagraph', {
    filter: (node: HTMLElement) => {
      if (!node || node.nodeName !== 'P') return false

      const classAttr
        = (node.getAttribute && node.getAttribute('class')) || ''
      const classes = classAttr.split(/\s+/).filter(Boolean)
      return classes.includes('poetry')
    },
    replacement: (content: string) => {
      const inner = content.trim()
      return `::lexikon-poetry

${inner}
    
::`
    }
  })

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

  return turndownService
}

function getPartNumberFromArticleId(articleId: string, slug: string) {
  const match = articleId.match(new RegExp(`^${escapeRegExp(slug)}-(\\d+)$`))
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
