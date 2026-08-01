/**
 * Globais de navegador usados pelos leitores de código de barras do PDV/WMS
 * que ainda não fazem parte do lib.dom padrão do TypeScript.
 */
export {};

interface BarcodeDetectorResult {
  rawValue: string;
  format?: string;
}

declare global {
  interface BarcodeDetectorLike {
    detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]>;
  }

  interface BarcodeDetectorConstructor {
    new (options?: { formats?: string[] }): BarcodeDetectorLike;
    getSupportedFormats?(): Promise<string[]>;
  }

  interface Window {
    /** Safari/iOS legado */
    webkitAudioContext?: typeof AudioContext;
    /** Chrome Android / navegadores compatíveis */
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}
