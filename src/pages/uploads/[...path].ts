import type { APIRoute } from 'astro';
import { uploadDir } from '../../config';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

/**
 * Serves user-uploaded files from `uploadDir` (e.g. avatars, covers).
 *
 * The stored filenames are UUIDs, but we still guard against path traversal:
 * every segment must be non-empty, must not be `..` and must not contain a
 * backslash. Images get a long immutable cache header.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export const GET: APIRoute = async ({ params }) => {
  const raw = params.path;
  const segments = (Array.isArray(raw) ? raw.join('/') : raw ?? '')
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== '..' && !s.includes('\\'));

  if (segments.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = join(uploadDir, ...segments);
  try {
    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
    return new Response(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[uploads] could not read file:', err);
    return new Response('Not found', { status: 404 });
  }
};
