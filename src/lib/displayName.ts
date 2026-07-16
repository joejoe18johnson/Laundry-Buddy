const NAME_TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'don', 'prof', 'sir'])

/** Greeting label — prefers last name; strips honorifics like Mr. or Mrs. */
export function getGreetingName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fullName.trim()

  const withoutTitles = parts.filter((part) => !NAME_TITLES.has(part.replace(/\./g, '').toLowerCase()))
  const nameParts = withoutTitles.length > 0 ? withoutTitles : parts

  if (nameParts.length === 1) return nameParts[0]
  return nameParts[nameParts.length - 1]
}
