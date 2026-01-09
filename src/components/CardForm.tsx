import type { CardData, ArtistType } from '../types/card'

interface CardFormProps {
  data: CardData
  onChange: (data: CardData) => void
  onGenerate: () => void
}

export function CardForm({ data, onChange, onGenerate }: CardFormProps) {
  const updateField = <K extends keyof CardData>(field: K, value: CardData[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="card">
      <h2 className="card-title">Informations de la carte</h2>

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

      <button onClick={onGenerate} className="btn-primary">
        Générer la carte
      </button>
    </div>
  )
}
