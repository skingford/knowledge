import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const dictionaryPath = path.join(rootDir, 'docs/.vitepress/theme/vocabulary-dictionary.json')
const issues = []
const allowedSources = new Set([
  'oxford',
  'cambridge',
  'merriam-webster',
  'collins',
  'official-docs',
  'manual-review',
])

const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'))

checkDictionary()
walk(docsDir)

if (issues.length) {
  console.error('Vocabulary frontmatter check failed:\n')
  for (const issue of issues) {
    console.error(`- ${issue.file}:${issue.line} ${issue.message}`)
  }
  process.exit(1)
}

console.log('Vocabulary phonetic check passed.')

function checkDictionary() {
  for (const [key, entry] of Object.entries(dictionary)) {
    const file = path.relative(rootDir, dictionaryPath)
    const line = 1

    if (!/^[a-z0-9-]+$/.test(key)) {
      issues.push({ file, line, message: `dictionary key \`${key}\` must use kebab-case` })
    }

    if (!entry || typeof entry !== 'object') {
      issues.push({ file, line, message: `dictionary key \`${key}\` must map to an object` })
      continue
    }

    if (!entry.word) {
      issues.push({ file, line, message: `dictionary key \`${key}\` is missing \`word\`` })
    }

    if (!entry.meaning) {
      issues.push({ file, line, message: `dictionary key \`${key}\` is missing \`meaning\`` })
    }

    if (!entry.phoneticUs) {
      issues.push({ file, line, message: `dictionary key \`${key}\` is missing \`phoneticUs\`` })
    }

    if (!entry.phoneticSource) {
      issues.push({ file, line, message: `dictionary key \`${key}\` is missing \`phoneticSource\`` })
    } else if (!allowedSources.has(entry.phoneticSource)) {
      issues.push({
        file,
        line,
        message: `dictionary key \`${key}\` has unsupported phoneticSource \`${entry.phoneticSource}\``,
      })
    }

    for (const field of ['phoneticUs', 'phoneticUk']) {
      if (!entry[field]) continue
      if (!/^\/.+\/$/.test(entry[field])) {
        issues.push({
          file,
          line,
          message: `dictionary key \`${key}\` has invalid ${field} format: expected /.../`,
        })
      }
    }

    if (entry.phoneticSource && entry.phoneticSource !== 'manual-review') {
      if (!entry.phoneticSourceUrl) {
        issues.push({
          file,
          line,
          message: `dictionary key \`${key}\` is missing \`phoneticSourceUrl\` for source \`${entry.phoneticSource}\``,
        })
      } else if (!/^https?:\/\/\S+$/.test(entry.phoneticSourceUrl)) {
        issues.push({
          file,
          line,
          message: `dictionary key \`${key}\` has invalid \`phoneticSourceUrl\``,
        })
      }
    }
  }
}

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
  const relativePath = path.relative(rootDir, filePath)
  let inVocabulary = false
  let vocabIndent = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const indent = line.match(/^ */)?.[0].length ?? 0
    const trimmed = line.trim()
    const lineNumber = index + 1

    if (!inVocabulary && trimmed === 'vocabulary:') {
      inVocabulary = true
      vocabIndent = indent
      continue
    }

    if (!inVocabulary) continue

    if (trimmed && indent <= vocabIndent && !trimmed.startsWith('- ')) {
      inVocabulary = false
      continue
    }

    if (!trimmed.startsWith('- ')) continue

    const value = trimmed.slice(2).trim()
    if (!value) {
      issues.push({ file: relativePath, line: lineNumber, message: 'vocabulary entry must not be empty' })
      continue
    }

    if (/^(word|meaning|phonetic|phoneticUs|phoneticUk|phoneticSource|phoneticSourceUrl|ref):/.test(value)) {
      issues.push({
        file: relativePath,
        line: lineNumber,
        message: 'inline vocabulary objects are deprecated; use dictionary keys instead',
      })
      continue
    }

    const ref = readValue(value)
    if (!dictionary[ref]) {
      issues.push({
        file: relativePath,
        line: lineNumber,
        message: `unknown vocabulary key \`${ref}\``,
      })
    }
  }
}

function readValue(value) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}
