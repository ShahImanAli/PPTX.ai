export function toInternalPath(raw?: string | null): string | null {
  if (!raw) return null
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return null
}
