import { useState, useEffect, useRef } from 'react'
import {
  searchTracks,
  SpotifyTrack,
  getTrackYear,
  getArtistNames,
} from '../services/spotify'
import { getArtistTypeFromMusicBrainz } from '../services/musicbrainz'
import type { CardData } from '../types/card'

interface SpotifySearchProps {
  onSelect: (data: Partial<CardData>) => void
}

export function SpotifySearch({ onSelect }: SpotifySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showTypeWarning, setShowTypeWarning] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Handle clicks outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      const tracks = await searchTracks(query)
      setResults(tracks)
      setIsLoading(false)
      setShowResults(true)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSelect = async (track: SpotifyTrack) => {
    const artistName = getArtistNames(track)
    let artistCount = track.artists.length

    // Vérifier aussi les featurings dans le titre du morceau (ex: "Confessions nocturnes (feat. Vitaa)")
    const featRegex = /\(?\s*(?:feat(?:uring)?\.?|ft\.?|with|et|and|avec|vs\.?|x)\s+([^)]+)\)?/i
    const featMatch = track.name.match(featRegex)
    if (featMatch) {
      // Compter les artistes supplémentaires dans le featuring
      const featArtists = featMatch[1].split(/\s*(?:&|,)\s*/).filter(a => a.trim().length > 0)
      artistCount += featArtists.length
    }

    // Si plusieurs artistes détectés, on peut déterminer le type directement
    if (artistCount >= 2) {
      const type = artistCount === 2 ? 'duo' : 'group'
      onSelect({
        artist: artistName,
        title: track.name,
        year: getTrackYear(track),
        spotifyLink: track.external_urls.spotify,
        previewUrl: track.previewUrl,
        type,
      })
      setQuery('')
      setResults([])
      setShowResults(false)
      return
    }

    // Un seul artiste - envoyer les données de base immédiatement
    onSelect({
      artist: artistName,
      title: track.name,
      year: getTrackYear(track),
      spotifyLink: track.external_urls.spotify,
      previewUrl: track.previewUrl,
    })

    setQuery('')
    setResults([])
    setShowResults(false)

    // Récupérer le type d'artiste via MusicBrainz (en arrière-plan) pour savoir si c'est un solo ou un groupe
    try {
      const type = await getArtistTypeFromMusicBrainz(artistName)
      onSelect({
        artist: artistName,
        title: track.name,
        year: getTrackYear(track),
        spotifyLink: track.external_urls.spotify,
        previewUrl: track.previewUrl,
        type: type || 'solo',
      })
    } catch (error) {
      console.error('Error detecting artist type:', error)
      setShowTypeWarning(true)
    }
  }

  return (
    <div className="spotify-search" ref={containerRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Rechercher un titre sur Spotify..."
          className="form-input search-input"
        />
        {isLoading && <span className="search-spinner"></span>}
      </div>

      {showResults && results.length > 0 && (
        <ul className="search-results">
          {results.map((track) => (
            <li key={track.id} onClick={() => handleSelect(track)} className="search-result-item">
              {track.album.images[2] && (
                <img
                  src={track.album.images[2].url}
                  alt={track.album.name}
                  className="result-album-art"
                />
              )}
              <div className="result-info">
                <span className="result-title">{track.name}</span>
                <span className="result-artist">
                  {getArtistNames(track)} • {getTrackYear(track)}
                </span>
              </div>
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
