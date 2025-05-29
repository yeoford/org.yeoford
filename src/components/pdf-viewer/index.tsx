import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { createLog } from '@helpers/log';

const log = createLog('PdfViewer');

// Update worker configuration to use a more reliable CDN
// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/legacy/build/pdf.worker.min.js',
//   import.meta.url
// ).toString();

export const PdfViewer = ({ path }: { path: string }) => {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const maxWidth = 800;
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth);

  // log.info('path', path);

  // const onResize = useCallback<ResizeObserverCallback>((entries) => {
  //   const [entry] = entries;

  //   if (entry) {
  //     setContainerWidth(entry.contentRect.width);
  //   }
  // }, []);

  // useResizeObserver(containerRef, resizeObserverOptions, onResize);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    log.info('onDocumentLoadSuccess', { numPages });
    setNumPages(numPages);
    setError(null);
    setLoading(false);
  };

  const onError = (error: Error) => {
    log.error('onError', error);
    setError(error.message);
    setLoading(false);
  };

  const nextPage = () => {
    setPageNumber((v) => v + 1);
  };

  const prevPage = () => {
    setPageNumber((v) => v - 1);
  };

  const onLoadError = (error: Error) => {
    log.error('onLoadError', error);
    setError(error.message);
    setLoading(false);
  };

  useEffect(() => {
    log.info('path', path);
    setLoading(true);
    setError(null);
  }, [path]);

  // log.info('path', path);

  return (
    <div className="flex flex-col items-center w-full h-full p-4">
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">
          Error loading PDF: {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          Loading PDF... (Worker: {pdfjs.version})
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={pageNumber <= 1}
          onClick={prevPage}>
          Previous
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={pageNumber >= (numPages ?? -1)}
          onClick={nextPage}>
          Next
        </button>
      </div>
      <div className="flex-1 w-full flex justify-center">
        <Document
          className="my-react-pdf"
          file={path}
          loading={null}
          onError={onError}
          onLoadError={onLoadError}
          onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNumber}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            width={containerWidth}
          />
        </Document>
      </div>
      <p className="mt-4 text-gray-600">
        Page {pageNumber} of {numPages}
      </p>
    </div>
  );
};
