import { NextResponse } from 'next/server';
import { getObject, getFeatured } from '@/lib/met';

/**
 * GET /api/met?id=436524     → one Artwork
 * GET /api/met?q=monet&count=12 → { artworks: Artwork[] }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const q = searchParams.get('q');
  const count = Math.min(Number(searchParams.get('count') ?? '12') || 12, 40);

  if (id) {
    const art = await getObject(id);
    return art
      ? NextResponse.json(art)
      : NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (q) {
    const artworks = await getFeatured(q, count);
    return NextResponse.json({ artworks });
  }

  return NextResponse.json({ error: 'provide ?id or ?q' }, { status: 400 });
}
