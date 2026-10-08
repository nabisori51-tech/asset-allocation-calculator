export type EndpointLabel<T> = T & { y: number; labelY: number }

export function distributeEndpointLabels<T extends { y: number }>(items: T[], minY: number, maxY: number, gap = 16): EndpointLabel<T>[] {
  const sorted = items.slice().sort((a, b) => a.y - b.y)
  if (!sorted.length) return []
  const low = Math.min(minY, maxY), high = Math.max(minY, maxY)
  const positions = sorted.map((item) => Math.max(low, Math.min(high, item.y)))
  for (let i = 1; i < positions.length; i++) positions[i] = Math.max(positions[i], positions[i - 1] + gap)
  const overflow = positions[positions.length - 1] - high
  if (overflow > 0) for (let i = 0; i < positions.length; i++) positions[i] -= overflow
  if (positions[0] < low) for (let i = 0; i < positions.length; i++) positions[i] += low - positions[0]
  return sorted.map((item, index) => ({ ...item, labelY: positions[index] }))
}

export type ChartPoint = { x: number; y: number }
export type EndpointPlacement<T> = T & { x: number; y: number; labelWidth: number }

function overlapsRect(a: ChartPoint, b: ChartPoint, rect: { left: number; right: number; top: number; bottom: number }) {
  let t0 = 0, t1 = 1
  const dx = b.x - a.x, dy = b.y - a.y
  for (const [p, q] of [[-dx, a.x - rect.left], [dx, rect.right - a.x], [-dy, a.y - rect.top], [dy, rect.bottom - a.y]] as const) {
    if (p === 0) { if (q < 0) return false; continue }
    const t = q / p
    if (p < 0) { if (t > t1) return false; t0 = Math.max(t0, t) }
    else { if (t < t0) return false; t1 = Math.min(t1, t) }
  }
  return t0 <= t1
}

export function placeEndpointLabels<T>(items: EndpointPlacement<T>[], curves: ChartPoint[][], bounds: { left: number; right: number; top: number; bottom: number }) {
  const placed: Array<{ left: number; right: number; top: number; bottom: number }> = []
  return items.map((item) => {
    const options = [
      ...[1, -1].flatMap((side) => [-18, 18, -32, 32, 0].map((dy) => ({ side, dy }))),
    ].map(({ side, dy }) => {
      const labelX = item.x + side * 10
      const labelY = item.y + dy
      const textAnchor = side > 0 ? "start" as const : "end" as const
      const rect = { left: side > 0 ? labelX : labelX - item.labelWidth, right: side > 0 ? labelX + item.labelWidth : labelX, top: labelY - 6, bottom: labelY + 8 }
      const inside = rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom
      const curveHits = curves.reduce((sum, points) => {
        let hits = 0
        for (let i = 1; i < points.length; i++) {
          if (overlapsRect(points[i - 1], points[i], { left: rect.left - 2, right: rect.right + 2, top: rect.top - 2, bottom: rect.bottom + 2 })) hits++
        }
        return sum + hits
      }, 0)
      const labelHits = placed.filter((other) => !(rect.right < other.left || rect.left > other.right || rect.bottom < other.top || rect.top > other.bottom)).length
      const nearEdgeX = side > 0 ? rect.left : rect.right
      const distance = Math.hypot(nearEdgeX - item.x, labelY - item.y)
      return { side, labelX, labelY, textAnchor, rect, score: (inside ? 0 : 1e9) + curveHits * 1e6 + labelHits * 1e7 + distance }
    }).sort((a, b) => a.score - b.score)
    const choice = options[0]
    placed.push(choice.rect)
    return { ...item, labelX: choice.labelX, labelY: choice.labelY, textAnchor: choice.textAnchor, leaderX: choice.labelX + (choice.side > 0 ? -4 : 4) }
  })
}
