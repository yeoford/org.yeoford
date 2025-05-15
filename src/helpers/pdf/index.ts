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

const log = createLog('pdf');

const NEWSLETTERS_DIR = path.resolve(import.meta.dir, '../../../newsletter');

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const scanNewsletters = async () => {
  log.debug('newsletters path is ', NEWSLETTERS_DIR);

  const entries = await Bun.$`ls ${NEWSLETTERS_DIR}/*.pdf`.text();
  const pdfFiles = entries.trim().split('\n');

  for await (const file of pdfFiles) {
    const result = await processNewsletter(file);
    log.debug('result', result);
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

  const dateRect = {
    x: 785,
    y: 97,
    width: 373,
    height: 120,
  };

  const descriptionRect = {
    x: 49,
    y: 1540,
    width: 1093,
    height: 100,
  };

  const issueRect = {
    x: 936,
    y: 244,
    width: 193,
    height: 73,
  };

  const dateText = await getTextInRect(firstPage, dateRect);
  const description = await getTextInRect(firstPage, descriptionRect);
  const issueText = await getTextInRect(firstPage, issueRect);

  // log.debug('dateText', dateText);
  // log.debug('description', description);
  // log.debug('issueText', issueText);

  const imageBuffer = await renderPageToImage(firstPage);

  // save the image buffer to a file
  await Bun.write(path.resolve(NEWSLETTERS_DIR, 'test.jpg'), imageBuffer);

  const title = await pdf.getTitle();
  const author = await pdf.getAuthor();
  const subject = await pdf.getSubject();
  const keywords = await pdf.getKeywords();

  // log.debug('pdf', { title, author, subject, keywords });

  return {
    path: filePath,
    text: {
      date: dateText,
      issue: issueText,
      description,
    },
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

const getTextInRect = async (page: PDFPageProxy, rect: Rect) => {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 2.0 });

  const pdfRectToPixelRect = (pdfRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    // Convert from PDF coordinates to pixel coordinates
    const pixelX = pdfRect.x * viewport.scale;
    const pixelY =
      (viewport.height / viewport.scale - pdfRect.y) * viewport.scale;
    const pixelWidth = pdfRect.width * viewport.scale;
    const pixelHeight = pdfRect.height * viewport.scale;

    return {
      x: pixelX,
      y: pixelY - pixelHeight,
      width: pixelWidth,
      height: pixelHeight,
    };
  };

  const text = textContent.items
    .filter((item: TextItem | TextMarkedContent) => {
      if ('str' in item) {
        // Get the text item's bounding box in PDF coordinates
        const x = item.transform[4];
        const y = item.transform[5];
        const width = item.width || 0;
        const height = item.height || 0;

        if (height === 0) {
          return false;
        }

        // Convert to pixel coordinates for debugging
        const pixelRect = pdfRectToPixelRect({ x, y, width, height });
        // Check if the text item is within the target rectangle
        return rectIntersects(pixelRect, rect);
      }
      return false;
    })
    .map((item: TextItem | TextMarkedContent) =>
      'str' in item ? item.str : ''
    )
    .join(' ');

  return text;
};

const rectIntersects = (rect1: Rect, rect2: Rect) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};
