const NAME_TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'don', 'prof', 'sir'])

/** Greeting label — first name plus last initial, e.g. Sarah Johnson → Sarah J. */
export function getGreetingName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fullName.trim()

  const withoutTitles = parts.filter((part) => !NAME_TITLES.has(part.replace(/\./g, '').toLowerCase()))
  const nameParts = withoutTitles.length > 0 ? withoutTitles : parts

  if (nameParts.length === 1) return nameParts[0]

  const firstName = nameParts[0]
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}
