#!/usr/bin/env ts-node

import fs from 'node:fs'
import path from 'node:path'
import pug from 'pug'
import chapters from './meta/chapters.json'
import yaml from 'yaml'
import type { ChapterMeta } from '../schemas'
import { writeOutput } from './helpers'

convertFromJson()
convertStandalonePage(
  'pug-to-md/views/ueber-den-lexikon-roman.pug',
  'Über den Lexikon-Roman',
  'content/ueber.md'
)

function convertFromJson() {
  for (const chapter of chapters) {
    const { index, slug } = chapter

    const inputPath = `pug-to-md/views/chapters/${slug}.pug`

    // if (index >= 286) {
    //   inputPath = `pug-to-md/views/${ slug }.pug`
    // }

    const outputPath = `content/artikel/${index.toString().padStart(3, '0')}.${slug}.md`

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

  const chapterDir = `${chapter.index.toString().padStart(3, '0')}.${chapter.slug}`
  const isMultiPart = chapter.articlesCount > 1

  if (!isMultiPart) {
    const htmlOutputPath = `pug-to-md/generated/html/${chapterDir}.html`
    writeOutput(html, htmlOutputPath)

    const articleHtml = extractSingleArticleHtml(html)
    const markdownBody = normalizeContentHtml(articleHtml)
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
  const partsByOrder = [...htmlParts].sort((a, b) => a.partNumber - b.partNumber)

  for (const part of partsByOrder) {
    const partNumber = part.partNumber
    const paddedPart = partNumber.toString().padStart(2, '0')
    const partOutputPath = `content/artikel/${chapterDir}/${paddedPart}.md`
    const partHtmlOutputPath = `pug-to-md/generated/html/${chapterDir}/${paddedPart}.html`
    writeOutput(part.htmlDocument, partHtmlOutputPath)

    const partChapter = { ...chapter, title: `${chapter.title} ${partNumber}`, articleIndex: partNumber }
    const markdownBody = normalizeContentHtml(part.articleHtml)
    const markdown = toChapterMarkdown(partChapter, markdownBody)
    writeOutput(markdown, partOutputPath)
  }
}

function splitMultipartHtml(html: string, slug: string) {
  const articlePattern = new RegExp(
    `<article\\b[^>]*\\bid=(["'])${escapeRegExp(slug)}-(\\d+)\\1[^>]*>[\\s\\S]*?<\\/article>`,
    'g'
  )

  const sluggedParts = [...html.matchAll(articlePattern)]
  if (sluggedParts.length > 0) {
    return sluggedParts.map((match) => {
      const partNumber = Number.parseInt(match[2]!, 10)
      const partHtml = match[0].trim()
      return { partNumber, articleHtml: partHtml, htmlDocument: toPartHtmlDocument(partHtml) }
    })
  }

  const genericPattern = /<article\b[^>]*>[\s\S]*?<\/article>/gi
  const fallbackParts = [...html.matchAll(genericPattern)]
  if (fallbackParts.length > 0) {
    console.warn(
      `Could not match multipart articles by slug for "${slug}". Falling back to article order.`
    )

    return fallbackParts.map((match, index) => {
      const partNumber = index + 1
      const partHtml = match[0].trim()
      return { partNumber, articleHtml: partHtml, htmlDocument: toPartHtmlDocument(partHtml) }
    })
  }

  return []
}

function toPartHtmlDocument(articleHtml: string) {
  const styleSheetLink = '<head><link rel="stylesheet" href="../../../styles/style.css" /></head>'
  return [
    '<!doctype html>',
    '<html lang="de">',
    styleSheetLink,
    '<body><main>',
    articleHtml,
    '</main></body>',
    '</html>'
  ].join('')
}

function extractSingleArticleHtml(html: string) {
  const match = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)
  if (!match) {
    console.warn('Could not find <article> in rendered HTML. Falling back to <main> contents.')
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
    return (mainMatch?.[1] || html).trim()
  }
  return match[0].trim()
}

function normalizeContentHtml(html: string) {
  let normalized = html.trim()
  normalized = unwrapArticle(normalized)
  normalized = removeInlineTitle(normalized)
  normalized = rewriteClasses(normalized)
  normalized = rewriteChapterHrefs(normalized)
  normalized = rewriteImageSources(normalized)
  normalized = rewriteTextareas(normalized)
  return normalized.trim()
}

function rewriteTextareas(html: string) {
  return html.replace(
    /<textarea([^>]*)><\/textarea>/g,
    (_match, attrs: string) => {
      const placeholderMatch = attrs.match(/placeholder=(['"])([^'"]*)\1/)
      const placeholder = placeholderMatch ? placeholderMatch[2] : ''
      return `\n:u-textarea{placeholder="${placeholder}" class="w-full"}`
    }
  )
}

function unwrapArticle(html: string) {
  const match = html.match(/^<article\b[^>]*>([\s\S]*?)<\/article>$/i)
  if (!match) return html
  return match[1]!.trim()
}

function removeInlineTitle(html: string) {
  const withoutInlineTitle = html.replace(
    /<h2\b[^>]*\bclass=(['"])[^'"]*\binline-title\b[^'"]*\1[^>]*>[\s\S]*?<\/h2>\s*/i,
    ''
  )

  if (withoutInlineTitle !== html) return withoutInlineTitle

  return html.replace(/<h2\b[^>]*>[\s\S]*?<\/h2>\s*/i, '')
}

function rewriteClasses(html: string) {
  return html.replace(/\bclass=(['"])([^'"]*)\1/g, (_match, quote: string, classAttr: string) => {
    const classNames = classAttr
      .split(/\s+/)
      .filter(Boolean)
      .map(className => className === 'arrow' ? 'arrow-link' : className)

    if (classNames.length === 0) return ''
    return `class=${quote}${classNames.join(' ')}${quote}`
  })
}

function rewriteChapterHrefs(html: string) {
  return html.replace(/\bhref=(['"])([^'"]+)\1/g, (_match, quote: string, href: string) => {
    return `href=${quote}${rewriteChapterHref(href.trim())}${quote}`
  })
}

function rewriteChapterHref(href: string) {
  if (/^(?:[a-z]+:)?\/\//i.test(href)) return href
  if (href.startsWith('#') || href.startsWith('/')) return href

  const [pathWithExtension, fragment] = href.split('#')
  if (!pathWithExtension!.endsWith('.html')) return href

  const slug = pathWithExtension!.replace(/\.html$/i, '')
  if (!slug) return href

  if (!fragment) return `/artikel/${slug}`

  const partMatch = fragment.match(/-(\d+)$/)
  if (!partMatch) return `/artikel/${slug}#${fragment}`

  const part = partMatch[1]!.padStart(2, '0')
  return `/artikel/${slug}/${part}`
}

function rewriteImageSources(html: string) {
  return html.replace(/\bsrc=(['"])([^'"]+)\1/g, (_match, quote: string, src: string) => {
    const normalizedSrc = src.trim().replaceAll('\\', '/')

    if (!normalizedSrc.startsWith('../assets/')) {
      return `src=${quote}${normalizedSrc}${quote}`
    }

    const filename = path.posix.basename(normalizedSrc)
    return `src=${quote}/img/${filename}${quote}`
  })
}

function toChapterMarkdown(chapter: ChapterMeta, body: string) {
  let markdown = '---\n'
  markdown += yaml.stringify(chapter)
  markdown += '---\n\n'
  if (!chapter.titleEndsWithPeriod) {
    body = body.replace(/^<p>/, `<p>${chapter.title} `)
  }
  markdown += body + '\n'
  return markdown
}

function convertStandalonePage(inputPath: string, title: string, outputPath: string) {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  let html: string
  try {
    html = pug.renderFile(inputPath, {
      basedir: path.dirname(inputPath),
      filename: inputPath
    })
  } catch (err) {
    console.error('Error while rendering Pug to HTML:')
    console.error(err)
    process.exit(1)
  }

  const articleHtml = extractSingleArticleHtml(html)
  const markdownBody = normalizeContentHtml(articleHtml)

  let markdown = '---\n'
  markdown += yaml.stringify({ title })
  markdown += '---\n\n'
  markdown += markdownBody + '\n'

  writeOutput(markdown, outputPath)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
