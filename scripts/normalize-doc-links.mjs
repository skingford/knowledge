import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const workspacePrefix = '/Users/kingford/workspace/'
const blockedHrefPrefixes = [workspacePrefix, 'file://', 'vscode://file/', 'obsidian://']
const checkMode = process.argv.includes('--check')
const issues = []
const titleCache = new Map()
const updatedFiles = []

walk(docsDir)

if (checkMode) {
  if (issues.length) {
    console.error('Absolute local doc links found:\n')
    for (const issue of issues) {
      console.error(`- ${issue.file}:${issue.line} ${issue.message}`)
    }
    process.exit(1)
  }

  console.log('Doc link check passed.')
  process.exit(0)
}

if (!updatedFiles.length) {
  console.log('No doc links needed normalization.')
  process.exit(0)
}

for (const file of updatedFiles) {
  console.log(`Normalized ${file}`)
}

console.log(`Normalized ${updatedFiles.length} file(s).`)

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.vitepress') continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    processFile(fullPath)
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  let changed = false

  const normalized = content.replace(/\[([^\]]+)\]\(([^)\s]+(?:#[^)]+)?)\)/g, (match, label, href, offset) => {
    const plainLabel = unwrapCodeSpan(label)

    if (plainLabel.startsWith(workspacePrefix)) {
      const docTitle = resolveDocTitle(filePath, href)
      if (checkMode) {
        issues.push({
          file: path.relative(rootDir, filePath),
          line: getLineNumber(content, offset),
          message: `link text uses absolute local path; replace with \`${docTitle}\` for ${href}`,
        })
        return match
      }

      changed = true
      return `[${escapeLinkLabel(docTitle)}](${href})`
    }

    if (blockedHrefPrefixes.some((prefix) => href.startsWith(prefix))) {
      issues.push({
        file: path.relative(rootDir, filePath),
        line: getLineNumber(content, offset),
        message: `link href uses local-only protocol or absolute path ${href}`,
      })
    }

    return match
  })

  if (checkMode) return

  if (issues.length) {
    console.error('Local-only doc links found:\n')
    for (const issue of issues) {
      console.error(`- ${issue.file}:${issue.line} ${issue.message}`)
    }
    process.exit(1)
  }

  if (!checkMode && changed) {
    fs.writeFileSync(filePath, normalized)
    updatedFiles.push(path.relative(rootDir, filePath))
  }
}

function resolveDocTitle(sourceFilePath, href) {
  const hrefPath = href.split('#')[0]

  if (!hrefPath || /^(?:[a-z]+:|\/)/i.test(hrefPath)) {
    return fallbackLabel(hrefPath || href)
  }

  const targetPath = path.resolve(path.dirname(sourceFilePath), hrefPath)

  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
    return fallbackLabel(hrefPath)
  }

  if (titleCache.has(targetPath)) {
    return titleCache.get(targetPath)
  }

  const title = readDocTitle(targetPath) || fallbackLabel(hrefPath)
  titleCache.set(targetPath, title)
  return title
}

function readDocTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)

  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m)
    if (titleMatch) return stripQuotes(titleMatch[1].trim())
  }

  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim()

  return ''
}

function unwrapCodeSpan(value) {
  return value.trim().replace(/^`+/, '').replace(/`+$/, '')
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }

  return value
}

function fallbackLabel(hrefPath) {
  return path.basename(hrefPath, path.extname(hrefPath))
}

function escapeLinkLabel(value) {
  return value.replace(/[[\]]/g, '\\$&')
}

function getLineNumber(content, offset) {
  return content.slice(0, offset).split('\n').length
}
