import type { DefaultTheme } from 'vitepress'

const headingRegex = /<h(\d*).*?>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentRegex = /(.*?)<a.*? href="#(.*?)".*?>.*?<\/a>/i
const maxSectionTextLength = 400
const maxIndexedHeadingDepth = 1
const searchNoisePatterns = [
  /<svg\b[\s\S]*?<\/svg>/gi,
  /<pre\b[\s\S]*?<\/pre>/gi,
  /<style\b[\s\S]*?<\/style>/gi,
]

function clearHtmlTags(value: string) {
  return value.replace(/<[^>]*>/g, ' ')
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function normalizeSearchText(value: string) {
  return decodeHtmlEntities(clearHtmlTags(value))
    .replace(/\s+/g, ' ')
    .trim()
}

function getSearchableText(content: string) {
  const sanitized = searchNoisePatterns.reduce(
    (current, pattern) => current.replace(pattern, ''),
    content,
  )

  return normalizeSearchText(sanitized).slice(0, maxSectionTextLength)
}

async function* splitSearchPageIntoSections(_path: string, html: string) {
  const result = html.split(headingRegex)
  result.shift()

  let parentTitles: string[] = []

  for (let i = 0; i < result.length; i += 3) {
    const level = Number.parseInt(result[i], 10) - 1
    const heading = result[i + 1]
    const headingResult = headingContentRegex.exec(heading)
    const title = normalizeSearchText(headingResult?.[1] ?? '')
    const anchor = headingResult?.[2] ?? ''
    const content = result[i + 2]

    if (!title || !content) {
      continue
    }

    if (level > maxIndexedHeadingDepth) {
      continue
    }

    let titles = parentTitles.slice(0, level)
    titles[level] = title
    titles = titles.filter(Boolean)

    yield {
      anchor,
      text: getSearchableText(content),
      titles,
    }

    if (level === 0) {
      parentTitles = [title]
    } else {
      parentTitles[level] = title
    }
  }
}

export const localSearchOptions: DefaultTheme.LocalSearchOptions = {
  miniSearch: {
    _splitIntoSections: splitSearchPageIntoSections,
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
    },
  },
}
