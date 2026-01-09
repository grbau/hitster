// MusicBrainz API service for artist type detection
// API documentation: https://musicbrainz.org/doc/MusicBrainz_API

import type { ArtistType } from '../types/card'

interface MusicBrainzArtist {
  id: string
  name: string
  type: 'Person' | 'Group' | 'Orchestra' | 'Choir' | 'Character' | 'Other' | null
  score: number
}

interface MusicBrainzSearchResponse {
  artists: MusicBrainzArtist[]
}

// Cache pour éviter les requêtes répétées
const artistTypeCache = new Map<string, ArtistType>()

/**
 * Recherche le type d'artiste via MusicBrainz
 * @param artistName - Le nom de l'artiste
 * @returns 'solo' | 'duo' | 'group'
 */
export async function getArtistTypeFromMusicBrainz(artistName: string): Promise<ArtistType | null> {
  if (!artistName.trim()) return null

  // Vérifier le cache
  const cacheKey = artistName.toLowerCase().trim()
  if (artistTypeCache.has(cacheKey)) {
    return artistTypeCache.get(cacheKey)!
  }

  try {
    // MusicBrainz requiert un User-Agent personnalisé
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artistName)}&fmt=json&limit=1`,
      {
        headers: {
          'User-Agent': 'HitsterCardGenerator/1.0 (https://github.com/hitster-card-generator)',
        },
      }
    )

    if (!response.ok) {
      console.warn('MusicBrainz API error:', response.status)
      return null
    }

    const data: MusicBrainzSearchResponse = await response.json()

    if (data.artists && data.artists.length > 0) {
      const artist = data.artists[0]

      // Vérifier que le score de correspondance est suffisant (> 80%)
      if (artist.score < 80) {
        return null
      }

      let type: ArtistType = 'solo'

      if (artist.type === 'Group' || artist.type === 'Orchestra' || artist.type === 'Choir') {
        type = 'group'
      } else if (artist.type === 'Person') {
        type = 'solo'
      }

      // Mettre en cache
      artistTypeCache.set(cacheKey, type)

      return type
    }

    return null
  } catch (error) {
    console.error('MusicBrainz fetch error:', error)
    return null
  }
}

/**
 * Détermine le type d'artiste en combinant plusieurs sources
 * 1. Détection des collaborations dans le nom (feat., &, etc.)
 * 2. Requête MusicBrainz pour le premier artiste
 */
export async function detectArtistType(artistName: string): Promise<ArtistType> {
  // D'abord, vérifier s'il y a plusieurs artistes (collaborations)
  const separators = /\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bet\b|\bx\b)\s*/i
  const artists = artistName.split(separators).filter(a => a.trim().length > 0)

  if (artists.length >= 3) {
    return 'group'
  }

  if (artists.length === 2) {
    return 'duo'
  }

  // Un seul nom d'artiste - vérifier via MusicBrainz
  const mainArtist = artists[0].trim()
  const mbType = await getArtistTypeFromMusicBrainz(mainArtist)

  if (mbType) {
    return mbType
  }

  // Par défaut, retourner 'solo' si on ne peut pas déterminer
  return 'solo'
}
