import {
  transformerCompactLineOptions,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers'
import { createHighlighter, isSpecialLang, type Highlighter, type ShikiTransformer, type ShikiTransformerContext } from 'shiki'
import type { MarkdownOptions, ThemeOptions } from 'vitepress'

const usedLanguageIds: string[] = [
  'applescript',
  'bash',
  'c',
  'cpp',
  'css',
  'diff',
  'dockerfile',
  'go',
  'hcl',
  'html',
  'ini',
  'java',
  'javascript',
  'js',
  'json',
  'json5',
  'jsonc',
  'lua',
  'makefile',
  'markdown',
  'md',
  'nginx',
  'powershell',
  'protobuf',
  'python',
  'ruby',
  'rust',
  'sh',
  'shellscript',
  'sql',
  'svelte',
  'swift',
  'toml',
  'ts',
  'tsx',
  'typescript',
  'vim',
  'vue',
  'xml',
  'yaml',
  'txt',
]
const sharedHighlighterKey = '__knowledgeMarkdownHighlighterPromise__'
const vueRE = /-vue(?=:|$)/
const lineNoStartRE = /=(\d*)/
const lineNoRE = /:(no-)?line-numbers(=\d*)?$/
const mustacheRE = /\{\{.*?\}\}/g

type MarkdownTheme = NonNullable<MarkdownOptions['theme']>
type LanguageAlias = NonNullable<MarkdownOptions['languageAlias']>
type MarkdownHighlightOptions = Pick<
  MarkdownOptions,
  'codeTransformers' | 'defaultHighlightLang' | 'languageAlias' | 'theme'
>
type SharedGlobal = typeof globalThis & {
  __knowledgeMarkdownHighlighterPromise__?: Promise<Highlighter>
}

function resolveThemeList(theme: ThemeOptions): (string | object)[] {
  if (typeof theme === 'object' && theme !== null && 'light' in theme && 'dark' in theme) {
    return [theme.light, theme.dark]
  }
  return [theme]
}

function attrsToLines(attrs: string) {
  const parsed = attrs.replace(/^(?:\[.*?\])?.*?([\d,-]+).*/, '$1').trim()
  if (!parsed) {
    return []
  }

  return parsed
    .split(',')
    .flatMap((value) => {
      const [start, end] = value.split('-').map((part) => Number.parseInt(part, 10))
      if (Number.isNaN(start)) {
        return []
      }
      if (Number.isNaN(end)) {
        return [start]
      }

      return Array.from({ length: end - start + 1 }, (_, index) => start + index)
    })
    .map((line) => ({ line, classes: ['highlighted'] }))
}

function normalizeLanguage(lang: string, defaultLang: string, languageAlias: LanguageAlias, highlighter: Highlighter) {
  const strippedLang = lang
    .replace(lineNoStartRE, '')
    .replace(lineNoRE, '')
    .replace(vueRE, '')
    .toLowerCase() || defaultLang
  const aliasedLang = languageAlias[strippedLang] ?? strippedLang

  if (isSpecialLang(aliasedLang) || highlighter.getLoadedLanguages().includes(aliasedLang)) {
    return aliasedLang
  }

  return defaultLang
}

async function getSharedHighlighter(theme: ThemeOptions | undefined, languageAlias: LanguageAlias) {
  const sharedGlobal = globalThis as SharedGlobal

  sharedGlobal[sharedHighlighterKey] ??= createHighlighter({
    themes: theme ? resolveThemeList(theme) : [],
    langs: usedLanguageIds,
    langAlias: languageAlias,
  })

  return sharedGlobal[sharedHighlighterKey]
}

// VitePress disposes its internal Shiki singleton during some HMR paths.
// Keeping a repo-owned singleton avoids stale Markdown renderers crashing mid-refresh.
export async function createMarkdownHighlight({
  theme,
  languageAlias = {},
  defaultHighlightLang = 'txt',
  codeTransformers = [],
}: MarkdownHighlightOptions) {
  const highlighter = await getSharedHighlighter(theme, languageAlias)
  const transformers = [
    transformerNotationDiff({
      matchAlgorithm: 'v3',
    }),
    transformerNotationFocus({
      matchAlgorithm: 'v3',
      classActiveLine: 'has-focus',
      classActivePre: 'has-focused-lines',
    }),
    transformerNotationHighlight({
      matchAlgorithm: 'v3',
    }),
    transformerNotationErrorLevel({
      matchAlgorithm: 'v3',
    }),
    {
      name: 'knowledge:add-class',
      pre(this: ShikiTransformerContext, node: Parameters<NonNullable<ShikiTransformer['pre']>>[0]) {
        this.addClassToHast(node, 'vp-code')
      },
    },
    {
      name: 'knowledge:clean-up',
      pre(node: { properties: Record<string, unknown> }) {
        delete node.properties.style
      },
    },
  ]

  return (source: string, lang: string, attrs: string) => {
    const vPre = vueRE.test(lang) ? '' : 'v-pre'
    const resolvedLang = normalizeLanguage(lang, defaultHighlightLang, languageAlias, highlighter)
    const lineOptions = attrsToLines(attrs)
    const mustaches = new Map<string, string>()
    let markerIndex = 0

    const removeMustache = (value: string) => {
      if (vPre) {
        return value
      }

      return value.replace(mustacheRE, (match) => {
        let marker = mustaches.get(match)
        if (!marker) {
          marker = `__vp_mustache_${markerIndex++}__`
          mustaches.set(match, marker)
        }
        return marker
      })
    }

    const restoreMustache = (value: string) => {
      mustaches.forEach((marker, match) => {
        value = value.replaceAll(marker, match)
      })
      return value
    }

    const commonOptions = {
      lang: resolvedLang,
      transformers: [
        ...transformers,
        transformerCompactLineOptions(lineOptions),
        {
          name: 'knowledge:v-pre',
          pre(node: Parameters<NonNullable<ShikiTransformer['pre']>>[0]) {
            if (vPre && node.properties) {
              node.properties['v-pre'] = ''
            }
          },
        },
        {
          name: 'knowledge:empty-line',
          code(hast: { children: Array<{ type: string; tagName?: string; properties?: { class?: string[] }; children?: unknown[] }> }) {
            hast.children.forEach((child) => {
              if (
                child.type === 'element' &&
                child.tagName === 'span' &&
                Array.isArray(child.properties?.class) &&
                child.properties.class.includes('line') &&
                Array.isArray(child.children) &&
                child.children.length === 0
              ) {
                child.children.push({
                  type: 'element',
                  tagName: 'wbr',
                  properties: {},
                  children: [],
                })
              }
            })
          },
        },
        ...codeTransformers,
      ],
      meta: { __raw: attrs },
    }

    let highlighted: string
    if (typeof theme === 'object' && theme !== null && 'light' in theme && 'dark' in theme) {
      highlighted = highlighter.codeToHtml(removeMustache(source).trimEnd(), {
        ...commonOptions,
        themes: theme,
        defaultColor: false,
      })
    } else {
      highlighted = highlighter.codeToHtml(removeMustache(source).trimEnd(), {
        ...commonOptions,
        theme: theme || 'github-dark',
      })
    }

    return restoreMustache(highlighted)
  }
}
