import QRCode from 'qrcode'
import type { CardData } from '../types/card'

const CM_TO_PX = 37.8

// Helper function to wrap text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

export function renderFrontCard(canvas: HTMLCanvasElement, data: CardData): void {
  const size = data.size * CM_TO_PX
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = '#A78BC6'
  ctx.fillRect(0, 0, size, size)

  // Icons
  ctx.fillStyle = 'white'
  ctx.font = `${size * 0.08}px Arial`
  ctx.fillText('🌐', size * 0.05, size * 0.12)

  const typeIcon = data.type === 'solo' ? '👤' : '👥'
  ctx.fillText(typeIcon, size * 0.88, size * 0.12)

  // Artist (with wrapping)
  ctx.fillStyle = 'black'
  ctx.font = `${size * 0.1}px Arial`
  const maxWidth = size * 0.9
  const artistLines = wrapText(ctx, data.artist, maxWidth)
  let artistY = size * 0.22
  for (const line of artistLines.slice(0, 2)) { // Max 2 lines for artist
    ctx.fillText(line, size * 0.05, artistY)
    artistY += size * 0.1
  }

  // Year (big)
  ctx.font = `bold ${size * 0.32}px Arial`
  ctx.fillText(data.year, size * 0.05, size * 0.55)

  // Title (with wrapping, smaller font)
  const titleFontSize = size * 0.07
  ctx.font = `${titleFontSize}px Arial`
  const titleLines = wrapText(ctx, data.title, maxWidth)
  let titleY = size * 0.70
  const lineHeight = titleFontSize * 1.2
  for (const line of titleLines.slice(0, 3)) { // Max 3 lines for title
    ctx.fillText(line, size * 0.05, titleY)
    titleY += lineHeight
  }

  // Created by and date (on same line)
  ctx.font = `${size * 0.05}px Arial`
  ctx.fillText(`by ${data.createdBy}`, size * 0.05, size * 0.95)
  ctx.textAlign = 'right'
  ctx.fillText(data.createdAt, size * 0.95, size * 0.95)
  ctx.textAlign = 'left'
}

export async function renderBackCard(canvas: HTMLCanvasElement, data: CardData): Promise<void> {
  const size = data.size * CM_TO_PX
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Black background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)

  // Colored rings
  const colors = ['#ff0055', '#ffcc00', '#00bfff', '#00ff88']
  colors.forEach((color, i) => {
    ctx.strokeStyle = color
    ctx.lineWidth = size * 0.03
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.25 + i * 8, 0, Math.PI * 2)
    ctx.stroke()
  })

  // QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(data.spotifyLink, {
      width: size * 0.45,
      margin: 0,
    })

    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = qrDataUrl
    })

    ctx.drawImage(img, size * 0.275, size * 0.275, size * 0.45, size * 0.45)
  } catch (error) {
    console.error('Error generating QR code:', error)
  }

  // Created by
  ctx.fillStyle = 'white'
  ctx.font = `${size * 0.05}px Arial`
  ctx.fillText(`by ${data.createdBy}`, size * 0.05, size * 0.95)
}
