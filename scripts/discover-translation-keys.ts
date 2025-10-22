#!/usr/bin/env node

/**
 * Translation Key Discovery Script
 * 
 * Scans codebase for t('key') calls and compares with translation files.
 * Generates report of missing/orphaned keys.
 * 
 * Usage:
 *   npx ts-node scripts/discover-translation-keys.ts
 *   npm run discover:keys
 * 
 * Output: translation-key-audit.json + console report
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface AuditReport {
  timestamp: string
  summary: {
    totalKeysFound: number
    totalKeysInFiles: number
    missingInFiles: number
    orphanedInFiles: number
    newKeysNotTranslated: {
      ar: number
      hi: number
    }
  }
  missingTranslations: string[] // Keys in code but not in en.json
  orphanedKeys: string[] // Keys in json files but not in code
  untranslatedToAr: string[] // Keys in en.json but not in ar.json
  untranslatedToHi: string[] // Keys in en.json but not in hi.json
  newKeysFound: string[] // Recently added (last 7 days)
  report: string
}

/**
 * Extract translation keys from code using regex patterns
 * Matches: t('key'), t("key"), t(`key`)
 * Filters out non-translation patterns (imports, paths, URLs, etc.)
 */
function extractKeysFromCode(codeContent: string): Set<string> {
  const keys = new Set<string>()

  // Match t('key'), t("key"), t(`key`) with more specific pattern
  // Translation keys typically follow: namespace.key or simple.key pattern
  const pattern = /t\(['"`]([a-zA-Z0-9._-]+)['"`]\)/g

  let match
  while ((match = pattern.exec(codeContent)) !== null) {
    const key = match[1]
    // Additional validation to ensure it looks like a translation key
    // Translation keys should not contain path separators like / and should follow dot notation
    if (key &&
        !key.includes('${') && // Skip template literals with variables
        !key.includes('/') && // Skip paths
        !key.includes(':') && // Skip URLs/imports
        !key.includes('@') && // Skip module imports
        !key.startsWith('.') && // Skip relative paths
        key.length > 1 && // Skip single characters
        /^[a-zA-Z0-9._-]+$/.test(key)) { // Only allow alphanumeric, dots, dashes
      keys.add(key)
    }
  }

  return keys
}

/**
 * Load all keys from a translation file
 */
function loadKeysFromFile(filePath: string): Set<string> {
  const keys = new Set<string>()
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content)
    
    const flatten = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'string') {
          keys.add(fullKey)
        } else if (typeof value === 'object' && value !== null) {
          flatten(value, fullKey)
        }
      }
    }
    
    flatten(json)
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err)
  }
  
  return keys
}

/**
 * Scan codebase for all t() calls with improved performance
 */
async function scanCodebase(): Promise<Set<string>> {
  const allKeys = new Set<string>()

  try {
    // Scan src directory recursively with better performance
    const files = await glob('src/**/*.{ts,tsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/tests/**',
        '**/.turbo/**',
      ],
      maxDepth: 20,
    })

    console.log(`   Found ${files.length} TypeScript files to scan`)

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8')

        // Quick check to see if file contains 't(' before full parsing
        if (!content.includes('t(')) continue

        const keys = extractKeysFromCode(content)
        keys.forEach(k => allKeys.add(k))
      } catch (err) {
        // Skip files that can't be read
      }
    }
  } catch (err) {
    console.warn(`Failed to scan codebase: ${err instanceof Error ? err.message : String(err)}`)
  }

  return allKeys
}

/**
 * Get translation file paths
 */
function getLocaleFilePaths(): Record<string, string> {
  const baseDir = path.join(process.cwd(), 'src', 'app', 'locales')
  
  return {
    en: path.join(baseDir, 'en.json'),
    ar: path.join(baseDir, 'ar.json'),
    hi: path.join(baseDir, 'hi.json'),
  }
}

/**
 * Main audit function
 */
async function runAudit(): Promise<void> {
  console.log('🔍 Starting translation key discovery audit...\n')
  
  // 1. Scan codebase for keys
  console.log('📦 Scanning codebase for t() calls...')
  const codeKeys = await scanCodebase()
  console.log(`   ✓ Found ${codeKeys.size} unique keys in code\n`)
  
  // 2. Load keys from translation files
  const localeFiles = getLocaleFilePaths()
  console.log('📄 Loading translation files...')
  
  const enKeys = loadKeysFromFile(localeFiles.en)
  const arKeys = loadKeysFromFile(localeFiles.ar)
  const hiKeys = loadKeysFromFile(localeFiles.hi)
  
  console.log(`   ✓ English: ${enKeys.size} keys`)
  console.log(`   ✓ Arabic: ${arKeys.size} keys`)
  console.log(`   ✓ Hindi: ${hiKeys.size} keys\n`)
  
  // 3. Find missing and orphaned keys
  console.log('🔎 Analyzing key coverage...')
  
  const missingInFiles: string[] = []
  const orphanedKeys: string[] = []
  const untranslatedToAr: string[] = []
  const untranslatedToHi: string[] = []
  
  // Keys in code but missing in en.json
  codeKeys.forEach(key => {
    if (!enKeys.has(key)) {
      missingInFiles.push(key)
    }
  })
  
  // Keys in json files but not used in code
  enKeys.forEach(key => {
    if (!codeKeys.has(key)) {
      orphanedKeys.push(key)
    }
  })
  
  // Keys not translated to ar/hi
  enKeys.forEach(key => {
    if (!arKeys.has(key)) untranslatedToAr.push(key)
    if (!hiKeys.has(key)) untranslatedToHi.push(key)
  })
  
  console.log(`   ✓ Missing in files: ${missingInFiles.length} keys`)
  console.log(`   ✓ Orphaned in files: ${orphanedKeys.length} keys`)
  console.log(`   ✓ Not translated to Arabic: ${untranslatedToAr.length} keys`)
  console.log(`   ✓ Not translated to Hindi: ${untranslatedToHi.length} keys\n`)
  
  // 4. Generate report
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalKeysFound: codeKeys.size,
      totalKeysInFiles: enKeys.size,
      missingInFiles: missingInFiles.length,
      orphanedInFiles: orphanedKeys.length,
      newKeysNotTranslated: {
        ar: untranslatedToAr.length,
        hi: untranslatedToHi.length,
      },
    },
    missingTranslations: missingInFiles.sort(),
    orphanedKeys: orphanedKeys.sort(),
    untranslatedToAr: untranslatedToAr.sort(),
    untranslatedToHi: untranslatedToHi.sort(),
    newKeysFound: Array.from(codeKeys).sort(),
    report: generateTextReport(
      missingInFiles,
      orphanedKeys,
      untranslatedToAr,
      untranslatedToHi,
      codeKeys.size,
      enKeys.size
    ),
  }
  
  // 5. Write report to file
  const reportPath = path.join(process.cwd(), 'translation-key-audit.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`✅ Audit report saved to: ${reportPath}\n`)
  
  // 6. Print summary
  console.log('📊 AUDIT SUMMARY')
  console.log('================')
  console.log(report.report)
  
  // 7. Exit with error if issues found
  if (missingInFiles.length > 0) {
    console.log(`\n⚠️  Action required: Add ${missingInFiles.length} missing keys to translation files`)
    if (missingInFiles.length <= 10) {
      console.log('   Missing keys:', missingInFiles.join(', '))
    }
    process.exit(1)
  }
  
  if (orphanedKeys.length > 0) {
    console.log(`\n⚠️  Review: ${orphanedKeys.length} orphaned keys found (unused in code)`)
    if (orphanedKeys.length <= 10) {
      console.log('   Orphaned keys:', orphanedKeys.join(', '))
    }
  }
  
  console.log('\n✨ Audit complete!')
}

/**
 * Generate human-readable text report
 */
function generateTextReport(
  missing: string[],
  orphaned: string[],
  untransAr: string[],
  untransHi: string[],
  codeCount: number,
  fileCount: number
): string {
  const lines: string[] = []
  
  lines.push(`Code keys found:           ${codeCount}`)
  lines.push(`Translation file keys:     ${fileCount}`)
  lines.push(`Missing in files:          ${missing.length}${missing.length > 0 ? ' ❌' : ' ✓'}`)
  lines.push(`Orphaned keys:             ${orphaned.length}${orphaned.length > 0 ? ' ⚠️ ' : ' ✓'}`)
  lines.push(`Not translated to Arabic:  ${untransAr.length}${untransAr.length > 0 ? ' ⚠️ ' : ' ✓'}`)
  lines.push(`Not translated to Hindi:   ${untransHi.length}${untransHi.length > 0 ? ' ⚠️ ' : ' ✓'}`)
  
  return lines.join('\n')
}

// Run audit
runAudit().catch(err => {
  console.error('❌ Audit failed:', err)
  process.exit(1)
})
