import './globals.css'

export const metadata = {
  title: 'BenMaorGal - Build Your Own Game!',
  description: 'Talk to a game-making robot and create your own games!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
