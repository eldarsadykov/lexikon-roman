#!/usr/bin/env ts-node

import fs from 'node:fs'
import path from 'node:path'
import pug from 'pug'
import TurndownService from 'turndown'
import chapters from './meta/chapters.json'
import yaml from 'yaml'
import type { ChapterMeta } from '../schemas'
import { writeOutput } from './helpers'

convertFromJson()

function convertFromJson() {
  for (const chapter of chapters) {
    const { index, slug } = chapter

    const inputPath = `pug-to-md/views/chapters/${slug}.pug`

    // if (index >= 286) {
    //   inputPath = `pug-to-md/views/${ slug }.pug`
    // }

    const outputPath = `content/kapitel/${index.toString().padStart(3, '0')}.${slug}.md`

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
      filename: inputPath,
      pretty: '  '
    })
  } catch (err) {
    console.error('Error while rendering Pug to HTML:')
    console.error(err)
    process.exit(1)
  }

  const chapterDir = `${chapter.index.toString().padStart(3, '0')}.${chapter.slug}`
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
    const htmlOutputPath = `pug-to-md/generated/html/${chapterDir}.html`
    writeOutput(html, htmlOutputPath)

    const markdown = toChapterMarkdown(chapter, markdownBody)
    writeOutput(markdown, outputPath)
    return
  }

  const htmlParts = splitMultipartHtml(html, chapter.slug)
  if (htmlParts.length !== chapter.articlesCount) {
    console.warn(
      `HTML article count mismatch for "${chapter.slug}": expected ${chapter.articlesCount}, found ${htmlParts.length}`
    )
  }
  const htmlPartsByNumber = new Map(htmlParts.map(part => [part.partNumber, part.html]))

  const parts = splitMultipartMarkdown(markdownBody)
  if (parts.length !== chapter.articlesCount) {
    console.warn(
      `Article count mismatch for "${chapter.slug}": expected ${chapter.articlesCount}, found ${parts.length}`
    )
  }

  for (const part of parts) {
    const paddedPart = part.partNumber.toString().padStart(2, '0')
    const partOutputPath = `content/kapitel/${chapterDir}/${paddedPart}.md`
    const partHtmlOutputPath = `pug-to-md/generated/html/${chapterDir}/${paddedPart}.html`
    const partHtml = htmlPartsByNumber.get(part.partNumber)

    if (partHtml) {
      writeOutput(partHtml, partHtmlOutputPath)
    } else {
      console.warn(`HTML part not found for "${chapter.slug}" part ${part.partNumber}`)
    }

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
    const partNumber = Number.parseInt(match[1]!, 10)
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? markdown.length
    const partMarkdown = markdown.slice(start, end).trim()
    return { partNumber, markdown: partMarkdown }
  })
}

function splitMultipartHtml(html: string, slug: string) {
  const articlePattern = new RegExp(
    `<article\\b[^>]*\\bid=(["'])${escapeRegExp(slug)}-(\\d+)\\1[^>]*>[\\s\\S]*?<\\/article>`,
    'g'
  )

  const parts = [...html.matchAll(articlePattern)]
  return parts.map((match) => {
    const partNumber = Number.parseInt(match[2]!, 10)
    const partHtml = match[0].trim()
    const styleSheetLink = '<head><link rel="stylesheet" href="../../../styles/style.css" /></head>'
    const partHtmlWithStyles = [
      '<!doctype html>',
      '<html lang="de">',
      styleSheetLink,
      '<body><main>',
      partHtml,
      '</main></body>',
      '</html>'
    ].join('')
    return { partNumber, html: partHtmlWithStyles }
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

  turndownService.addRule('links', {
    filter: (node: HTMLElement) => {
      return node.nodeName === 'A'
    },
    replacement: (content: string, node: HTMLElement) => {
      const mdcClasses = (node.getAttribute('class') || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(className => className === 'arrow' ? 'arrow-link' : className)
        .reduce((a, b) => a + '.' + b, '')

      const numberedHref = getNumberedHref(node)
      const text = content.trim()
      return `[${text}](/kapitel/${numberedHref}){${mdcClasses}}`
    }
  })

  turndownService.addRule('images', {
    filter: 'img',
    replacement: (_content: string, node: HTMLElement) => {
      const src = node.getAttribute('src')?.trim() || ''
      if (!src) return ''

      const normalizedSrc = src.replace(/\\/g, '/')
      const filename = path.posix.basename(normalizedSrc)
      const rewrittenSrc = normalizedSrc.startsWith('../assets/')
        ? `/img/${filename}`
        : normalizedSrc

      const alt = (node.getAttribute('alt') || '').replaceAll(']', '\\]')

      return `![${alt}](${rewrittenSrc})`
    }
  })

  return turndownService
}

function getNumberedHref(node: HTMLElement) {
  const href = node.getAttribute('href')?.replace('.html', '') || ''
  const [slug, partString] = href.split('#')
  const partNumber = partString?.replace(slug ?? '', '').replace('-', '')
  const partNumberPadded = partNumber?.toString().padStart(2, '0')
  return slug + (partNumberPadded ? `/${partNumberPadded}` : '')
}

function getPartNumberFromArticleId(articleId: string, slug: string) {
  const match = articleId.match(new RegExp(`^${escapeRegExp(slug)}-(\\d+)$`))
  if (!match) return null
  return Number.parseInt(match[1]!, 10)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
