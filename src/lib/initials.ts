/** Up to two initials for a name ("Person UI" -> "PU", "Anna Maria Kowalska" -> "AM"), for marks and avatars. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toLocaleUpperCase()
}
