import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const issues = []

walk(docsDir)

if (issues.length) {
  console.error('Found vocabulary frontmatter entries still using `phonetic:` instead of `phoneticUs` / `phoneticUk`:\n')
  for (const issue of issues) {
    console.error(`- ${issue.file}:${issue.line}`)
  }
  process.exit(1)
}

console.log('Vocabulary phonetic check passed.')

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === '.vitepress') continue
      walk(fullPath)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    checkFile(fullPath)
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.startsWith('---\n')) return

  const end = content.indexOf('\n---', 4)
  if (end === -1) return

  const frontmatter = content.slice(4, end)
  if (!/\nvocabulary:\s*(?:\n|$)/.test(`\n${frontmatter}`)) return

  const lines = frontmatter.split('\n')
  let inVocabulary = false
  let vocabIndent = 0

  lines.forEach((line, index) => {
    const indent = line.match(/^ */)?.[0].length ?? 0
    const trimmed = line.trim()

    if (!inVocabulary && /^vocabulary:\s*$/.test(trimmed)) {
      inVocabulary = true
      vocabIndent = indent
      return
    }

    if (!inVocabulary) return

    if (trimmed && indent <= vocabIndent && !trimmed.startsWith('- ')) {
      inVocabulary = false
      return
    }

    if (/^phonetic:\s+/.test(trimmed)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        line: index + 1,
      })
    }
  })
}
