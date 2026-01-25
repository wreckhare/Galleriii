import { NextRequest, NextResponse } from 'next/server';

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

    // Extract Open Graph tags
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

    // Fallback to regular meta tags if OG tags not found
    const fallbackTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const fallbackDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);

    const title = titleMatch?.[1] || fallbackTitleMatch?.[1] || '';
    const description = descMatch?.[1] || fallbackDescMatch?.[1] || '';
    const image = imageMatch?.[1] || '';

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
