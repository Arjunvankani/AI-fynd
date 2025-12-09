import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yelp Rating Predictor - Review Analysis Tool',
  description: 'Predict Yelp review ratings using advanced AI analysis and feedback learning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

