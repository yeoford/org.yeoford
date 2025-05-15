declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const getDocument: any;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  const worker: string;
  export default worker;
}
