import { compose } from '@/lib/studio/compose';
import type { StudioMode } from '@/lib/frame';

// Sharp needs native binaries — pin the Node runtime, not Edge.
export const runtime = 'nodejs';
export const maxDuration = 60;

interface ExportBody {
  src?: string;
  mode?: StudioMode;
  matColor?: string;
  margin?: number;
  position?: string;
}

/**
 * POST /api/export  { src, mode, matColor?, margin?, position? }
 * → streams a 3840×2160 sRGB JPEG, ready for the Frame.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExportBody;
    if (!body.src) {
      return Response.json({ error: 'src required' }, { status: 400 });
    }

    const srcRes = await fetch(body.src);
    if (!srcRes.ok) {
      return Response.json({ error: 'failed to fetch source image' }, { status: 502 });
    }
    const input = Buffer.from(await srcRes.arrayBuffer());

    const out = await compose(input, {
      mode: body.mode ?? 'museumMat',
      matColor: body.matColor,
      margin: body.margin,
      position: body.position,
    });

    return new Response(new Uint8Array(out), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="framio-3840x2160.jpg"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'export failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
