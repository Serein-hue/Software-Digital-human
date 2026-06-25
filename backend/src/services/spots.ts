import { SPOTS, SPOT_MAP } from '../data.js'
import type { ListQuery } from '../http/query.js'

type Spot = (typeof SPOTS)[number]

export type SpotSummary = Pick<Spot, 'id' | 'name' | 'category' | 'location' | 'shortIntro' | 'heroGradient'>

export function toSpotSummary(spot: Spot): SpotSummary {
  const { id, name, category, location, shortIntro, heroGradient } = spot
  return { id, name, category, location, shortIntro, heroGradient }
}

export function listSpots(query: ListQuery): SpotSummary[] {
  return SPOTS
    .filter((spot) => !query.category || spot.category === query.category)
    .filter((spot) => {
      if (!query.search) return true
      return `${spot.name} ${spot.category} ${spot.location} ${spot.shortIntro}`.includes(query.search)
    })
    .map(toSpotSummary)
}

export function getSpot(id: string) {
  return SPOT_MAP[id] ?? null
}

export function getRelatedSpots(id: string): SpotSummary[] | null {
  const spot = getSpot(id)
  if (!spot) return null

  return spot.related.flatMap((relatedId) => {
    const related = SPOT_MAP[relatedId]
    return related ? [toSpotSummary(related)] : []
  })
}
