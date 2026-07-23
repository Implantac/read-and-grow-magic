import { rgb, type PDFFont, type PDFPage } from 'pdf-lib';

// Convert mm → PDF points (1 mm = 2.83465 pt)
export const MM = 2.83465;

export interface DrawCtx {
  page: PDFPage;
  helv: PDFFont;
  helvBold: PDFFont;
  pageHeightMm: number;
}

export function drawText(
  ctx: DrawCtx,
  text: string,
  xMm: number,
  yMm: number,
  options?: { size?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; maxWidth?: number }
) {
  const size = options?.size ?? 8;
  const font = options?.bold ? ctx.helvBold : ctx.helv;
  const align = options?.align ?? 'left';
  let str = text ?? '';

  if (options?.maxWidth) {
    const maxW = options.maxWidth * MM;
    while (str.length > 0 && font.widthOfTextAtSize(str, size) > maxW) {
      str = str.slice(0, -1);
    }
  }

  let x = xMm * MM;
  const width = font.widthOfTextAtSize(str, size);
  if (align === 'center') x -= width / 2;
  else if (align === 'right') x -= width;

  const y = (ctx.pageHeightMm - yMm) * MM - size; // baseline adjust
  ctx.page.drawText(str, { x, y, size, font, color: rgb(0, 0, 0) });
}

export function drawRect(
  ctx: DrawCtx,
  xMm: number,
  yMm: number,
  wMm: number,
  hMm: number,
  fill?: [number, number, number]
) {
  const x = xMm * MM;
  const y = (ctx.pageHeightMm - yMm - hMm) * MM;
  const w = wMm * MM;
  const h = hMm * MM;
  ctx.page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.3,
    color: fill ? rgb(fill[0], fill[1], fill[2]) : undefined,
  });
}

export function triggerDownload(bytes: Uint8Array, filename: string, mime: string) {
  // copy into a fresh ArrayBuffer (avoid SharedArrayBuffer typing issues)
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  const body = document.body || document.getElementsByTagName('body')[0];
  if (body) {
    body.appendChild(a);
    a.click();
    body.removeChild(a);
  }
  URL.revokeObjectURL(url);
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
