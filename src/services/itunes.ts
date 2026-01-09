// iTunes API service for dynamic genre and music search

export interface ITunesGenre {
  id: string
  name: string
}

export interface ITunesTrack {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  releaseDate: string
  artworkUrl100: string
  previewUrl?: string
  primaryGenreName: string
}

// iTunes genre IDs for music
// https://affiliate.itunes.apple.com/resources/documentation/genre-mapping/
const ITUNES_MUSIC_GENRES: ITunesGenre[] = [
  { id: '14', name: 'Pop' },
  { id: '21', name: 'Rock' },
  { id: '11', name: 'Jazz' },
  { id: '6', name: 'Country' },
  { id: '15', name: 'R&B/Soul' },
  { id: '7', name: 'Electronic' },
  { id: '17', name: 'Dance' },
  { id: '18', name: 'Hip-Hop/Rap' },
  { id: '24', name: 'Reggae' },
  { id: '22', name: 'Singer/Songwriter' },
  { id: '12', name: 'Latino' },
  { id: '50', name: 'Fitness & Workout' },
  { id: '2', name: 'Blues' },
  { id: '3', name: 'Comedy' },
  { id: '4', name: 'Children\'s Music' },
  { id: '5', name: 'Classical' },
  { id: '8', name: 'Holiday' },
  { id: '9', name: 'Opera' },
  { id: '10', name: 'Soul' },
  { id: '16', name: 'Soundtrack' },
  { id: '20', name: 'Alternative' },
  { id: '1262', name: 'Variété française' },
  { id: '52', name: 'Chanson française' },
]

// Get available genres
export function getAvailableGenres(): ITunesGenre[] {
  return ITUNES_MUSIC_GENRES
}

// Search tracks by genre using iTunes RSS feed (top songs by genre)
export async function searchByGenre(genreId: string, limit = 20): Promise<ITunesTrack[]> {
  try {
    // Use iTunes RSS feed for top songs by genre
    const response = await fetch(
      `https://itunes.apple.com/search?term=*&genreId=${genreId}&media=music&entity=song&limit=${limit}&country=FR`
    )

    if (!response.ok) {
      throw new Error('Genre search failed')
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Genre search error:', error)
    return []
  }
}

// Search for popular/random tracks (uses multiple parallel searches for better results)
export async function getRandomTracks(options: {
  genre?: string
  yearStart?: number
  yearEnd?: number
  limit?: number
}): Promise<ITunesTrack[]> {
  const { genre, yearStart, yearEnd } = options

  try {
    // Multiple search terms to get more variety
    const searchTerms = [
      'love', 'night', 'dance', 'heart', 'life', 'time', 'world',
      'music', 'dream', 'fire', 'baby', 'sun', 'moon', 'star',
      'happy', 'crazy', 'party', 'summer', 'forever', 'together',
      'you', 'me', 'we', 'girl', 'boy', 'man', 'woman'
    ]

    // Shuffle and pick 3 random terms for parallel searches
    const shuffledTerms = searchTerms.sort(() => Math.random() - 0.5).slice(0, 3)

    // Execute multiple searches in parallel
    const searchPromises = shuffledTerms.map(async (term) => {
      let url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=50&country=FR`
      if (genre) {
        url += `&genreId=${genre}`
      }

      try {
        const response = await fetch(url)
        if (!response.ok) return []
        const data = await response.json()
        return data.results || []
      } catch {
        return []
      }
    })

    const allResults = await Promise.all(searchPromises)

    // Merge and deduplicate results by trackId
    const seen = new Set<number>()
    let results: ITunesTrack[] = []

    for (const resultSet of allResults) {
      for (const track of resultSet) {
        if (!seen.has(track.trackId)) {
          seen.add(track.trackId)
          results.push(track)
        }
      }
    }

    // Filter by year if specified
    if (yearStart || yearEnd) {
      results = results.filter(track => {
        if (!track.releaseDate) return false
        const year = new Date(track.releaseDate).getFullYear()
        if (yearStart && year < yearStart) return false
        if (yearEnd && year > yearEnd) return false
        return true
      })
    }

    // Shuffle results for randomness
    return results.sort(() => Math.random() - 0.5)
  } catch (error) {
    console.error('Random tracks error:', error)
    return []
  }
}

// Get French charts / popular French songs (multiple parallel searches)
export async function getFrenchHits(yearStart?: number, yearEnd?: number): Promise<ITunesTrack[]> {
  const frenchTerms = [
    'chanson française', 'amour', 'vie', 'coeur', 'nuit', 'soleil',
    'Paris', 'été', 'danse', 'fête', 'rêve', 'temps', 'je', 'tu',
    'nous', 'toi', 'moi', 'jour', 'soir', 'belle', 'homme', 'femme'
  ]

  // Pick 3 random terms for parallel searches
  const shuffledTerms = frenchTerms.sort(() => Math.random() - 0.5).slice(0, 3)

  try {
    const searchPromises = shuffledTerms.map(async (term) => {
      try {
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=50&country=FR&lang=fr_fr`
        )
        if (!response.ok) return []
        const data = await response.json()
        return data.results || []
      } catch {
        return []
      }
    })

    const allResults = await Promise.all(searchPromises)

    // Merge and deduplicate results by trackId
    const seen = new Set<number>()
    let results: ITunesTrack[] = []

    for (const resultSet of allResults) {
      for (const track of resultSet) {
        if (!seen.has(track.trackId)) {
          seen.add(track.trackId)
          results.push(track)
        }
      }
    }

    // Filter by year if specified
    if (yearStart || yearEnd) {
      results = results.filter(track => {
        if (!track.releaseDate) return false
        const year = new Date(track.releaseDate).getFullYear()
        if (yearStart && year < yearStart) return false
        if (yearEnd && year > yearEnd) return false
        return true
      })
    }

    return results.sort(() => Math.random() - 0.5)
  } catch (error) {
    console.error('French hits error:', error)
    return []
  }
}

// Transform iTunes track to our format (compatible with SpotifyTrack)
export function transformITunesTrack(track: ITunesTrack) {
  return {
    id: String(track.trackId),
    name: track.trackName,
    artists: [{ name: track.artistName }],
    album: {
      name: track.collectionName,
      release_date: track.releaseDate,
      images: [
        { url: track.artworkUrl100?.replace('100x100', '300x300') || '' },
        { url: track.artworkUrl100?.replace('100x100', '100x100') || '' },
        { url: track.artworkUrl100 || '' },
      ],
    },
    external_urls: {
      spotify: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`,
    },
    previewUrl: track.previewUrl,
  }
}
