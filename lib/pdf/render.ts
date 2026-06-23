import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Render a React PDF document to a Buffer.
 * Works in Next.js server actions and API routes.
 */
export async function renderPdfToBuffer(
  document: ReactElement
): Promise<Buffer> {
  const buffer = await renderToBuffer(document as ReactElement<DocumentProps>);
  return Buffer.from(buffer);
}
