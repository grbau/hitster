export type ArtistType = 'solo' | 'duo' | 'group'

export interface CardData {
  artist: string
  title: string
  year: string
  type: ArtistType
  createdBy: string
  createdAt: string
  spotifyLink: string
  size: number
}

const today = new Date().toISOString().split('T')[0]

export const defaultCardData: CardData = {
  artist: 'Zaho',
  title: 'Je te promets',
  year: '2018',
  type: 'solo',
  createdBy: 'Gregory',
  createdAt: today,
  spotifyLink: 'https://open.spotify.com/intl-fr/track/1nVXhoO493AbkHvdbdYjQY?si=e73d6967b8804752',
  size: 8,
}
