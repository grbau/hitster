import { useEffect, useRef, useState } from 'react'
import type { CardData } from '../types/card'
import { renderFrontCard, renderBackCard } from '../utils/cardRenderer'

interface CardPreviewProps {
  data: CardData
  shouldRender: boolean
}

export function CardPreview({ data, shouldRender }: CardPreviewProps) {
  const frontCanvasRef = useRef<HTMLCanvasElement>(null)
  const backCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!shouldRender) return

    if (frontCanvasRef.current) {
      renderFrontCard(frontCanvasRef.current, data)
    }

    if (backCanvasRef.current) {
      renderBackCard(backCanvasRef.current, data)
    }
  }, [data, shouldRender])

  // Réinitialiser l'audio quand une nouvelle carte est générée
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }, [data.previewUrl])

  const downloadCard = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const printCards = () => {
    const frontCanvas = frontCanvasRef.current
    const backCanvas = backCanvasRef.current
    if (!frontCanvas || !backCanvas) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const frontDataUrl = frontCanvas.toDataURL('image/png')
    const backDataUrl = backCanvas.toDataURL('image/png')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impression carte Hitster</title>
          <style>
            @media print {
              @page { margin: 10mm; }
            }
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              gap: 20px;
              justify-content: center;
              align-items: flex-start;
              font-family: Arial, sans-serif;
            }
            .card-container {
              text-align: center;
            }
            .card-container h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #333;
            }
            img {
              max-width: 8cm;
              height: auto;
              border: 1px solid #ccc;
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <h3>Recto</h3>
            <img src="${frontDataUrl}" />
          </div>
          <div class="card-container">
            <h3>Verso</h3>
            <img src="${backDataUrl}" />
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (!shouldRender) {
    return (
      <div className="card">
        <div className="empty-state">
          Cliquez sur "Générer la carte" pour voir l'aperçu
        </div>
      </div>
    )
  }

  return (
    <div className="preview-wrapper">
      <div className="card preview-section">
        <div className="preview-header">
          <h3 className="preview-title">Recto</h3>
          <button
            onClick={() => downloadCard(frontCanvasRef.current, `hitster-${data.artist}-front.png`)}
            className="btn-link"
          >
            Télécharger
          </button>
        </div>
        <div className="canvas-container">
          <canvas ref={frontCanvasRef} />
        </div>
      </div>

      <div className="card preview-section">
        <div className="preview-header">
          <h3 className="preview-title">Verso</h3>
          <button
            onClick={() => downloadCard(backCanvasRef.current, `hitster-${data.artist}-back.png`)}
            className="btn-link"
          >
            Télécharger
          </button>
        </div>
        <div className="canvas-container">
          <canvas ref={backCanvasRef} />
        </div>
      </div>

      <button
        onClick={() => {
          downloadCard(frontCanvasRef.current, `hitster-${data.artist}-front.png`)
          setTimeout(() => {
            downloadCard(backCanvasRef.current, `hitster-${data.artist}-back.png`)
          }, 100)
        }}
        className="btn-secondary"
      >
        Télécharger les deux faces
      </button>

      <button onClick={printCards} className="btn-print">
        Imprimer les cartes
      </button>

      {data.previewUrl && (
        <div className="preview-player">
          <audio
            ref={audioRef}
            src={data.previewUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          <button
            onClick={() => {
              if (audioRef.current) {
                if (isPlaying) {
                  audioRef.current.pause()
                } else {
                  audioRef.current.play()
                }
              }
            }}
            className={`btn-play ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Écouter un extrait'}
          </button>
        </div>
      )}

      {data.spotifyLink && (
        <a
          href={data.spotifyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-spotify-link"
        >
          🎵 Écouter sur Spotify
        </a>
      )}
    </div>
  )
}
