import { renderToBuffer } from "@react-pdf/renderer";

/**
 * Render a React PDF document to a Buffer.
 * Works in Next.js server actions and API routes.
 */
export async function renderPdfToBuffer(
  document: any
): Promise<Buffer> {
  const buffer = await renderToBuffer(document as any);
  return Buffer.from(buffer);
}
