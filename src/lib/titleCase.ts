/** Words kept lowercase in Title Case unless first or last in the phrase. */
const MINOR_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'nor',
  'for',
  'yet',
  'so',
  'at',
  'by',
  'in',
  'of',
  'on',
  'to',
  'up',
  'as',
  'via',
  'per',
  'from',
  'with',
  'into',
  'over',
  'off',
  'out',
  'is',
  'vs',
])

function capitalizeWord(word: string): string {
  if (/^\d/.test(word)) return word
  if (word.length > 1 && word === word.toUpperCase()) return word
  const lower = word.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function titleCaseWord(word: string, isFirst: boolean, isLast: boolean): string {
  const match = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9'-]+)([^A-Za-z0-9]*)$/)
  if (!match) return word

  const [, lead, core, trail] = match
  const lower = core.toLowerCase()

  if (!isFirst && !isLast && MINOR_WORDS.has(lower)) {
    return `${lead}${lower}${trail}`
  }

  return `${lead}${capitalizeWord(core)}${trail}`
}

/** Title Case for UI copy — major words capitalized; articles/prepositions lowercased mid-phrase. */
export function toTitleCase(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return text

  const words = trimmed.split(/\s+/).filter(Boolean)
  return words
    .map((word, index) => titleCaseWord(word, index === 0, index === words.length - 1))
    .join(' ')
}

/** Title Case while preserving a host/person name segment. */
export function titleCaseWithName(template: string, name: string): string {
  if (!name.trim()) return toTitleCase(template)
  const placeholder = '__NAME__'
  return toTitleCase(template.replace(name, placeholder)).replace(placeholder, name)
}

/** Title Case for optional UI strings (undefined/null passthrough). */
export function titleCaseOptional(text: string | undefined | null): string {
  if (text == null || text === '') return text ?? ''
  return toTitleCase(text)
}
