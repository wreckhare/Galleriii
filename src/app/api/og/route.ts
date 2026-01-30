import { NextRequest, NextResponse } from 'next/server';

// Flexible OG tag extraction that handles different attribute orders and quote styles
function extractOgTag(html: string, property: string): string | null {
  const patterns = [
    // property="og:X" ... content="Y" (double quotes)
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    // content="Y" ... property="og:X" (reversed order)
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// Flexible meta tag extraction for fallbacks (name attribute)
function extractMetaTag(html: string, name: string): string | null {
  const patterns = [
    // name="X" ... content="Y"
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    // content="Y" ... name="X"
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Galleriii/1.0; +https://galleriii.com)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 });
    }

    const html = await response.text();

    // Extract Open Graph tags with flexible patterns
    const ogTitle = extractOgTag(html, 'og:title');
    const ogDescription = extractOgTag(html, 'og:description');
    const ogImage = extractOgTag(html, 'og:image');

    // Fallback to regular meta tags if OG tags not found
    const fallbackTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const fallbackDescription = extractMetaTag(html, 'description');

    // Also try twitter:image as fallback for image
    const twitterImage = extractMetaTag(html, 'twitter:image');

    const title = ogTitle || fallbackTitleMatch?.[1] || '';
    const description = ogDescription || fallbackDescription || '';
    const image = ogImage || twitterImage || '';

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
    });
  } catch (error) {
    console.error('Error fetching OG data:', error);
    return NextResponse.json({ error: 'Failed to parse metadata' }, { status: 500 });
  }
}
