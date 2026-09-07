import './globals.css'

export const metadata = {
  title: 'BenMaorGal - Build Your Own Game!',
  description: 'Talk to a game-making robot and create your own games!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "system-ui, 'Segoe UI', 'Arial Hebrew', 'Noto Sans Hebrew', Arial, sans-serif" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('benmaorgal-lang')||'he';document.documentElement.lang=l;document.documentElement.dir=l==='he'?'rtl':'ltr'}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
