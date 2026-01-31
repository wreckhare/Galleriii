'use client';

export function SpotifyPreconnect() {
  return (
    <>
      {/* DNS prefetch for faster DNS resolution */}
      <link rel="dns-prefetch" href="https://open.spotify.com" />

      {/* Preconnect establishes early connection (TCP + TLS handshake) */}
      <link rel="preconnect" href="https://open.spotify.com" crossOrigin="anonymous" />

      {/* Spotify SDK and assets domains */}
      <link rel="preconnect" href="https://sdk.scdn.co" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://i.scdn.co" crossOrigin="anonymous" />
    </>
  );
}
