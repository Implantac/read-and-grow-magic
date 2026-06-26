// Centralized client-side upload validation. Server/Storage policies remain
// the source of truth — this only blocks obviously invalid files early and
// gives users immediate feedback.

export interface FileValidationOptions {
  /** Allowed MIME types (exact match) or wildcards like "image/*". */
  mime?: string[];
  /** Allowed lowercase extensions without dot, e.g. ['csv','ofx']. */
  extensions?: string[];
  /** Maximum size in bytes. */
  maxBytes?: number;
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function mimeMatches(fileType: string, patterns: string[]): boolean {
  if (!fileType) return false;
  return patterns.some((p) => {
    if (p.endsWith('/*')) return fileType.startsWith(p.slice(0, -1));
    return fileType === p;
  });
}

export function validateFile(
  file: File,
  opts: FileValidationOptions,
): FileValidationResult {
  if (opts.maxBytes && file.size > opts.maxBytes) {
    const mb = (opts.maxBytes / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `Arquivo excede o limite de ${mb} MB.` };
  }
  // Defense in depth: accept if EITHER mime OR extension matches when both lists provided.
  const mimeOk = opts.mime ? mimeMatches(file.type, opts.mime) : true;
  const extOk = opts.extensions ? opts.extensions.includes(extOf(file.name)) : true;
  if (opts.mime && opts.extensions) {
    if (!mimeOk && !extOk) {
      return { ok: false, error: `Tipo de arquivo inválido. Permitido: ${opts.extensions.join(', ')}.` };
    }
  } else if (!mimeOk || !extOk) {
    const allowed = opts.extensions?.join(', ') || opts.mime?.join(', ') || '';
    return { ok: false, error: `Tipo de arquivo inválido. Permitido: ${allowed}.` };
  }
  return { ok: true };
}

export const MB = 1024 * 1024;
