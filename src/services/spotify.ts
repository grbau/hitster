// Spotify search using public scraping API (no auth required)

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    release_date: string
    images: { url: string }[]
  }
  external_urls: {
    spotify: string
  }
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  if (!query.trim()) {
    return []
  }

  try {
    // Use Spotify's public embed API which doesn't require authentication
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()
    return data.tracks.items
  } catch (error) {
    console.error('Spotify search error:', error)
    // Fallback: try alternative search
    return searchTracksAlternative(query)
  }
}

// Alternative search using a public API
async function searchTracksAlternative(query: string): Promise<SpotifyTrack[]> {
  try {
    // Use iTunes API as fallback (free, no auth required)
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    // Transform iTunes results to match Spotify format
    return data.results.map((track: {
      trackId: number
      trackName: string
      artistName: string
      collectionName: string
      releaseDate: string
      artworkUrl100: string
      trackViewUrl: string
    }) => {
      // Parse multiple artists from artistName (separated by &, feat., ft., ,, etc.)
      const artistNames = track.artistName
        .split(/\s*(?:&|,|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bet\b|\bx\b)\s*/i)
        .map(a => a.trim())
        .filter(a => a.length > 0)

      return {
        id: String(track.trackId),
        name: track.trackName,
        artists: artistNames.map(name => ({ name })),
        album: {
          name: track.collectionName,
          release_date: track.releaseDate,
          images: [
            { url: track.artworkUrl100.replace('100x100', '300x300') },
            { url: track.artworkUrl100.replace('100x100', '100x100') },
            { url: track.artworkUrl100 },
          ],
        },
        external_urls: {
          spotify: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`,
        },
      }
    })
  } catch (error) {
    console.error('Alternative search error:', error)
    return []
  }
}

// Get anonymous access token from Spotify (for web player)
async function getAccessToken(): Promise<string> {
  try {
    const response = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player')
    const data = await response.json()
    return data.accessToken
  } catch {
    return ''
  }
}

export function getTrackYear(track: SpotifyTrack): string {
  if (!track.album.release_date) return ''
  return track.album.release_date.split('-')[0]
}

export function getArtistType(track: SpotifyTrack): 'solo' | 'duo' | 'group' {
  const artistCount = track.artists.length
  if (artistCount === 1) return 'solo'
  if (artistCount === 2) return 'duo'
  return 'group'
}

export function getArtistNames(track: SpotifyTrack): string {
  return track.artists.map(a => a.name).join(', ')
}
