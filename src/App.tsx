import { useState } from 'react'
import { CardForm } from './components/CardForm'
import { CardPreview } from './components/CardPreview'
import type { CardData } from './types/card'
import { defaultCardData } from './types/card'

function App() {
  const [cardData, setCardData] = useState<CardData>(defaultCardData)
  const [shouldRender, setShouldRender] = useState(false)

  const handleGenerate = () => {
    setShouldRender(false)
    setTimeout(() => setShouldRender(true), 0)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="gradient-text">Hitster</span> Card Generator
        </h1>
        <p className="app-subtitle">
          Créez vos propres cartes pour le jeu Hitster
        </p>
      </header>

      <div className="main-grid">
        <div>
          <CardForm
            data={cardData}
            onChange={setCardData}
            onGenerate={handleGenerate}
          />
        </div>
        <div>
          <CardPreview data={cardData} shouldRender={shouldRender} />
        </div>
      </div>

      <footer className="app-footer">
        <p>Fait avec passion pour les fans de musique</p>
      </footer>
    </div>
  )
}

export default App
