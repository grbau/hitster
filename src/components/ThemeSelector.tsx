import { useState } from 'react'
import { getAvailableGenres, getRandomTracks, getFrenchHits, transformITunesTrack, ITunesTrack } from '../services/itunes'
import type { CardData } from '../types/card'

interface ThemeSelectorProps {
  onSelect: (data: Partial<CardData>) => void
}

// Décennies
const decades = [
  { value: '', label: 'Toutes les époques', yearStart: undefined as number | undefined, yearEnd: undefined as number | undefined },
  { value: '1960', label: 'Années 60', yearStart: 1960, yearEnd: 1969 },
  { value: '1970', label: 'Années 70', yearStart: 1970, yearEnd: 1979 },
  { value: '1980', label: 'Années 80', yearStart: 1980, yearEnd: 1989 },
  { value: '1990', label: 'Années 90', yearStart: 1990, yearEnd: 1999 },
  { value: '2000', label: 'Années 2000', yearStart: 2000, yearEnd: 2009 },
  { value: '2010', label: 'Années 2010', yearStart: 2010, yearEnd: 2019 },
  { value: '2020', label: 'Années 2020', yearStart: 2020, yearEnd: 2029 },
]

// Genres dynamiques depuis iTunes + option variété française
const genres = [
  { id: '', name: 'Tous les genres' },
  { id: 'french', name: 'Variété Française' }, // Special case
  ...getAvailableGenres().filter(g =>
    ['14', '21', '15', '7', '17', '18', '20', '10'].includes(g.id) // Pop, Rock, R&B, Electronic, Dance, Hip-Hop, Alternative, Soul
  )
]

export function ThemeSelector({ onSelect }: ThemeSelectorProps) {
  const [selectedDecade, setSelectedDecade] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ReturnType<typeof transformITunesTrack>[]>([])
  const [noResults, setNoResults] = useState(false)
  const [showTypeWarning, setShowTypeWarning] = useState(false)

  const searchByTheme = async () => {
    setIsLoading(true)
    setSuggestions([])
    setNoResults(false)

    try {
      const decade = decades.find(d => d.value === selectedDecade)
      const yearStart = decade?.yearStart
      const yearEnd = decade?.yearEnd

      let results: ITunesTrack[] = []

      if (selectedGenre === 'french') {
        // Special case for French music
        results = await getFrenchHits(yearStart, yearEnd)
      } else {
        // Use iTunes API with genre filter
        results = await getRandomTracks({
          genre: selectedGenre || undefined,
          yearStart,
          yearEnd,
          limit: 50
        })
      }

      // Transform and take random 5
      const transformed = results.map(transformITunesTrack)
      const shuffled = transformed.sort(() => Math.random() - 0.5).slice(0, 5)

      if (shuffled.length === 0) {
        setNoResults(true)
      } else {
        setSuggestions(shuffled)
      }
    } catch (error) {
      console.error('Theme search error:', error)
      setNoResults(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTrack = (track: ReturnType<typeof transformITunesTrack>) => {
    onSelect({
      artist: track.artists.map(a => a.name).join(', '),
      title: track.name,
      year: track.album.release_date ? new Date(track.album.release_date).getFullYear().toString() : '',
      spotifyLink: track.external_urls.spotify,
      previewUrl: track.previewUrl,
    })
    setSuggestions([])
    setShowTypeWarning(true)
  }

  const getTrackYear = (track: ReturnType<typeof transformITunesTrack>) => {
    if (!track.album.release_date) return ''
    return new Date(track.album.release_date).getFullYear().toString()
  }

  return (
    <div className="theme-selector">
      <div className="theme-selector-header">
        <span className="theme-selector-title">Ou découvrir par thème</span>
      </div>

      <div className="theme-selector-filters">
        <select
          value={selectedDecade}
          onChange={(e) => setSelectedDecade(e.target.value)}
          className="form-select"
        >
          {decades.map(decade => (
            <option key={decade.value} value={decade.value}>
              {decade.label}
            </option>
          ))}
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="form-select"
        >
          {genres.map(genre => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>

        <button
          onClick={searchByTheme}
          disabled={isLoading}
          className="btn-theme-search"
        >
          {isLoading ? 'Recherche...' : 'Proposer des titres'}
        </button>
      </div>

      {noResults && (
        <div className="theme-no-results">
          Aucun résultat trouvé. Essayez une autre combinaison.
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="theme-suggestions">
          {suggestions.map(track => (
            <li
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              className="theme-suggestion-item"
            >
              {track.album.images[2]?.url && (
                <img
                  src={track.album.images[2].url}
                  alt={track.album.name}
                  className="result-album-art"
                />
              )}
              <div className="result-info">
                <span className="result-title">{track.name}</span>
                <span className="result-artist">
                  {track.artists.map(a => a.name).join(', ')} • {getTrackYear(track)}
                </span>
              </div>
              {track.previewUrl && (
                <span className="result-has-preview" title="Extrait disponible">♪</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {showTypeWarning && (
        <div className="type-warning">
          Le type (Solo/Duo/Groupe) ne peut pas être déterminé automatiquement. Veuillez vérifier et ajuster si nécessaire.
          <button
            className="type-warning-close"
            onClick={() => setShowTypeWarning(false)}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
