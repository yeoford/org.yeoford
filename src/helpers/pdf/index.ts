import { PDFDocument, PDFPage } from 'pdf-lib';
import { createLog } from '@helpers/log';
import { Glob } from 'bun';
import path from 'node:path';
import type {
  PDFPageProxy,
  TextItem,
  TextMarkedContent,
} from 'pdfjs-dist/types/src/display/api';
import Canvas from '@napi-rs/canvas';

// Set up Node.js environment for PDF.js
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

// Configure PDF.js for Node.js environment
// pdfjs.GlobalWorkerOptions.workerSrc = '';

// Polyfill DOMMatrix for Node.js environment
// if (typeof global.DOMMatrix === 'undefined') {
//   interface DOMMatrixInit {
//     a?: number;
//     b?: number;
//     c?: number;
//     d?: number;
//     e?: number;
//     f?: number;
//   }

//   class DOMMatrixPolyfill implements DOMMatrixInit {
//     a: number;
//     b: number;
//     c: number;
//     d: number;
//     e: number;
//     f: number;

//     constructor(init?: DOMMatrixInit) {
//       this.a = init?.a ?? 1;
//       this.b = init?.b ?? 0;
//       this.c = init?.c ?? 0;
//       this.d = init?.d ?? 1;
//       this.e = init?.e ?? 0;
//       this.f = init?.f ?? 0;
//     }
//   }

//   global.DOMMatrix = DOMMatrixPolyfill as any;
// }

const log = createLog('pdf');

const NEWSLETTERS_DIR = path.resolve(import.meta.dir, '../../../newsletter');

export const scanNewsletters = async () => {
  log.debug('newsletters path is ', NEWSLETTERS_DIR);

  const entries = await Bun.$`ls ${NEWSLETTERS_DIR}/*.pdf`.text();
  const pdfFiles = entries.trim().split('\n');

  for await (const file of pdfFiles) {
    log.debug(file);
    processNewsletter(file);
  }

  // const newsletters = await Promise.all(files.map(async (file) => {
  //   const pdf = await PDFDocument.load(file);
  //   return pdf;
  // }));
};

export const processNewsletter = async (filePath: string) => {
  const pdfBytes = await Bun.file(filePath).arrayBuffer();
  const pdf = await PDFDocument.load(pdfBytes);

  // --- TEXT EXTRACTION (pdf.js) ---
  const pdfDoc = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const firstPage = await pdfDoc.getPage(1);
  const textContent = await firstPage.getTextContent();
  const text = textContent.items
    .map((item: TextItem | TextMarkedContent) =>
      'str' in item ? item.str : ''
    )
    .join(' ');

  // log.debug('text content', textContent);

  const imageBuffer = await renderPageToImage(firstPage);

  // save the image buffer to a file
  await Bun.write(path.resolve(NEWSLETTERS_DIR, 'test.jpg'), imageBuffer);

  // const firstPdfPage = pdf.getPages()[0];
  // const imageObjects = firstPdfPage.node.Resources().lookup('XObject', {});

  // log.debug('image objects', imageObjects.length);

  // const firstPage: PDFPage = pages[0];

  // const { width, height } = firstPage.getSize();

  // Extract text from the first page
  // const pdfData = await pdfParse(pdfBytes);
  // const text = pdfData.text;

  // log.debug('firstPage', { width, height });
  // log.debug('text content', text);

  const title = await pdf.getTitle();
  const author = await pdf.getAuthor();
  const subject = await pdf.getSubject();
  const keywords = await pdf.getKeywords();

  log.debug('pdf', { title, author, subject, keywords });

  return {
    text,
    metadata: {
      title,
      author,
      subject,
      keywords,
    },
  };
};

/**
 * Renders a single PDF page to an image buffer.
 *
 * @param {PDFPageProxy} page - The PDF.js page object.
 * @returns {Promise<Buffer>} The image as a buffer (JPEG format).
 */
const renderPageToImage = async (page: PDFPageProxy) => {
  // Scale the page to 2x for a higher quality image output
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = Canvas.createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  // Create a compatible render context
  const renderContext = {
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport: viewport,
  };

  try {
    // Render the PDF page to the canvas
    await page.render(renderContext).promise;

    // Convert the canvas content to a JPEG image buffer and return it
    // return canvas.encode('jpeg', { quality: 0.95 });
    return canvas.toBuffer('image/jpeg', 75);
  } catch (error) {
    log.error('Error rendering PDF page:', error);
    throw error;
  }
};
