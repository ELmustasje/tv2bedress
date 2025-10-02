export function formatDuration(durationSeconds: number): string {
  const totalSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} t`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} min`)
  }

  if (parts.length === 0) {
    parts.push(`${seconds} s`)
  }

  return parts.join(' ')
}
