export const metadata = {
  title: 'Iwamizu Athletic Performance',
  description: 'The Way of Athletic Performance',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body style={{ margin: 0, backgroundColor: '#000', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
