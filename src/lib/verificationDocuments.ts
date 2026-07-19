export function isPdfMimeType(mimeType?: string): boolean {
  if (!mimeType) return false
  return mimeType === 'application/pdf' || mimeType.endsWith('/pdf')
}

export function isImageMimeType(mimeType?: string): boolean {
  if (!mimeType) return false
  return mimeType.startsWith('image/')
}

export function inferMimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.heic')) return 'image/heic'
  return 'image/jpeg'
}

export function formatDocumentFileName(name?: string, fallback = 'Document'): string {
  if (!name?.trim()) return fallback
  return name.trim()
}
