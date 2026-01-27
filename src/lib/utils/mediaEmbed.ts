// Utilities for converting media URLs to embed formats

/**
 * Converts a Spotify share URL to an embed URL
 * @param url - Spotify share URL (e.g., https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp)
 * @returns Embed URL (e.g., https://open.spotify.com/embed/track/3n3Ppam7vgaVa1iaRUc9Lp)
 */
export function convertSpotifyUrl(url: string): string {
  try {
    // Already an embed URL
    if (url.includes('/embed/')) {
      return url;
    }

    // Convert standard URL to embed URL
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
  } catch (error) {
    console.error('Error converting Spotify URL:', error);
    return url;
  }
}

/**
 * Converts a YouTube watch URL to an embed URL
 * @param url - YouTube watch URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
 * @returns Embed URL and video ID
 */
export function convertYouTubeUrl(url: string): { embedUrl: string; videoId: string } | null {
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    // Handle youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    }
    // Handle youtu.be/VIDEO_ID
    else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    }

    if (!videoId) {
      return null;
    }

    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      videoId,
    };
  } catch (error) {
    console.error('Error converting YouTube URL:', error);
    return null;
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Alias for backward compatibility
export const validateUrl = isValidUrl;

/**
 * Extracts domain from URL for display
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}
