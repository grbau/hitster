import { useRef } from 'react'
import type { CardData, ArtistType } from '../types/card'
import { SpotifySearch } from './SpotifySearch'
import { ThemeSelector } from './ThemeSelector'

interface CardFormProps {
  data: CardData
  onChange: (data: CardData) => void
  onGenerate: () => void
}

// Recherche le previewUrl et spotifyLink via iTunes si non définis
async function fetchPreviewFromiTunes(artist: string, title: string): Promise<{ previewUrl?: string; spotifyLink?: string }> {
  try {
    const query = `${artist} ${title}`
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`
    )
    if (!response.ok) return {}

    const data = await response.json()
    if (data.results && data.results.length > 0) {
      const track = data.results[0]
      return {
        previewUrl: track.previewUrl,
        spotifyLink: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`
      }
    }
  } catch (error) {
    console.error('Error fetching preview from iTunes:', error)
  }
  return {}
}

export function CardForm({ data, onChange, onGenerate }: CardFormProps) {
  const generateButtonRef = useRef<HTMLButtonElement>(null)

  const updateField = <K extends keyof CardData>(field: K, value: CardData[K]) => {
    onChange({ ...data, [field]: value })
  }

  const handleSpotifySelect = (partialData: Partial<CardData>) => {
    onChange({ ...data, ...partialData })
    // Scroll vers le bouton générer après sélection
    setTimeout(() => {
      generateButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleGenerate = async () => {
    // Si pas de previewUrl, essayer de le récupérer via iTunes
    if (!data.previewUrl && data.artist && data.title) {
      const { previewUrl, spotifyLink } = await fetchPreviewFromiTunes(data.artist, data.title)
      if (previewUrl || spotifyLink) {
        onChange({
          ...data,
          previewUrl: previewUrl || data.previewUrl,
          spotifyLink: spotifyLink || data.spotifyLink
        })
      }
    }
    onGenerate()
  }

  return (
    <div className="card">
      <h2 className="card-title">Informations de la carte</h2>

      {/* Music Search */}
      <div className="spotify-section">
        <SpotifySearch onSelect={handleSpotifySelect} />
      </div>

      {/* Theme Selector */}
      <div className="theme-section">
        <ThemeSelector onSelect={handleSpotifySelect} />
      </div>

      <div className="form-divider"></div>

      <div className="form-group">
        <label className="form-label">Artiste</label>
        <input
          type="text"
          value={data.artist}
          onChange={(e) => updateField('artist', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Titre</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Année</label>
          <input
            type="text"
            value={data.year}
            onChange={(e) => updateField('year', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Type</label>
          <select
            value={data.type}
            onChange={(e) => updateField('type', e.target.value as ArtistType)}
            className="form-select"
          >
            <option value="solo">Solo</option>
            <option value="duo">Duo</option>
            <option value="group">Groupe</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Créé par</label>
          <input
            type="text"
            value={data.createdBy}
            onChange={(e) => updateField('createdBy', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date de création</label>
          <input
            type="date"
            value={data.createdAt}
            onChange={(e) => updateField('createdAt', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Lien Spotify</label>
        <input
          type="url"
          value={data.spotifyLink}
          onChange={(e) => updateField('spotifyLink', e.target.value)}
          className="form-input"
          placeholder="https://open.spotify.com/track/..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Taille de la carte (cm)</label>
        <input
          type="number"
          min="4"
          max="15"
          value={data.size}
          onChange={(e) => updateField('size', Number(e.target.value))}
          className="form-input"
        />
      </div>

      <button ref={generateButtonRef} onClick={handleGenerate} className="btn-primary">
        Générer la carte
      </button>
    </div>
  )
}
