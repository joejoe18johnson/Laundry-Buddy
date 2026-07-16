/** Title Case for UI copy — capitalizes each word. */
export function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^\d/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/** Title Case while preserving a host/person name segment. */
export function titleCaseWithName(template: string, name: string): string {
  const placeholder = '__NAME__'
  return toTitleCase(template.replace(name, placeholder)).replace(placeholder, name)
}
