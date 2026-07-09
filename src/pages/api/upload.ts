import type { APIRoute } from 'astro';
import { auth } from '../../lib/auth';
import { uploadDir, uploadLimits } from '../../config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * File-upload endpoint (avatars, project covers).
 *
 * Authenticated only. Accepts a single multipart file field named `file`,
 * validates it against `uploadLimits` (type + size), stores it under
 * `uploadDir` with a random UUID filename, and returns its public URL
 * (served by `/uploads/[...path]`). The extension is taken from the original
 * filename when safe, otherwise derived from the MIME type.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Map allowed image MIME types to a safe extension (without the dot). */
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const POST: APIRoute = async ({ request }) => {
  // Auth: any signed-in user may upload files for their own content.
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: 'unauthorized' }, 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'no_file' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return json({ error: 'no_file' }, 400);
  }

  if (file.size > uploadLimits.maxFileSizeBytes) {
    return json({ error: 'size' }, 413);
  }
  if (!(uploadLimits.allowedImageTypes as readonly string[]).includes(file.type)) {
    return json({ error: 'type' }, 415);
  }

  // Build a safe filename: <uuid>.<ext>. Strip anything but [a-z0-9] from the
  // original extension so it can never contain path separators or `..`.
  const rawExt = extname(file.name).toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = rawExt || MIME_EXT[file.type] || 'bin';
  const filename = `${randomUUID()}.${ext}`;

  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);
  } catch (err) {
    console.error('[upload] failed to write file:', err);
    return json({ error: 'failed' }, 500);
  }

  return json({ url: `/uploads/${filename}` }, 200);
};
