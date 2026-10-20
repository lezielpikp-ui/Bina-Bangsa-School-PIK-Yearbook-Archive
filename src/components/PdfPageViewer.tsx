/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite native URL import for worker script
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  FileText,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
  Grid,
  Sparkles,
  Columns,
  Square,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Yearbook } from '../types/yearbook';
import { getPdfFile } from '../services/pdfStore';
import { generateYearbookPdfBlob, downloadYearbookFile } from '../utils/pdfHelper';

// Polyfills for PDF.js compatibility across Vercel & modern browsers
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (!(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
  };
}

// Configure worker with Vite URL & CDN fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@6.4.299/build/pdf.worker.min.mjs';
  }
}

interface PdfPageViewerProps {
  yearbook: Yearbook;
  initialPage?: number;
  onPageChange?: (page: number, total: number) => void;
}

export const PdfPageViewer: React.FC<PdfPageViewerProps> = ({
  yearbook,
  initialPage = 1,
  onPageChange,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageInputVal, setPageInputVal] = useState<string>(String(initialPage));
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('spread');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [sourceType, setSourceType] = useState<'uploaded' | 'url' | 'generated'>('uploaded');

  // Canvas refs for main display
  const singleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // In-flight render task refs to prevent race conditions & cancellation errors
  const activeRenderTasksRef = useRef<pdfjsLib.RenderTask[]>([]);

  // Cancel any active rendering tasks
  const cancelActiveRenders = useCallback(() => {
    activeRenderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {
        // Ignored
      }
    });
    activeRenderTasksRef.current = [];
  }, []);

  // 1. Load the PDF document
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);
    cancelActiveRenders();

    async function loadPdf() {
      try {
        let pdfData: ArrayBuffer | Uint8Array | null = null;

        // A. Check IndexedDB/memory store for admin-uploaded PDF
        const stored = await getPdfFile(yearbook.id);
        if (stored && stored.byteLength > 0) {
          pdfData = stored;
          setSourceType('uploaded');
        } else if (yearbook.fileUrl && yearbook.fileUrl.startsWith('data:application/pdf')) {
          // B. Decode data URL
          const base64 = yearbook.fileUrl.split(',')[1];
          if (base64) {
            const binaryString = window.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            pdfData = bytes;
            setSourceType('url');
          }
        }

        // C. If no uploaded file yet, generate official archival document on the fly
        if (!pdfData) {
          const generatedBlob = generateYearbookPdfBlob(yearbook);
          pdfData = await generatedBlob.arrayBuffer();
          setSourceType('generated');
        }

        if (isCancelled) return;

        // CRITICAL BUG FIX: Always slice buffer copy so Web Worker transfer doesn't detach original ArrayBuffer in memory cache
        const bufferCopy = pdfData instanceof Uint8Array
          ? pdfData.slice()
          : new Uint8Array(pdfData.slice(0));

        let doc: pdfjsLib.PDFDocumentProxy;
        try {
          const loadingTask = pdfjsLib.getDocument({
            data: bufferCopy,
          });
          doc = await loadingTask.promise;
        } catch (dataLoadErr) {
          console.warn('Direct PDF data load issue, trying Blob URL loader:', dataLoadErr);
          const blob = new Blob([bufferCopy], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          const urlTask = pdfjsLib.getDocument({ url: blobUrl });
          doc = await urlTask.promise;
        }

        if (isCancelled) return;

        setPdfDoc(doc);
        const count = doc.numPages;
        setTotalPages(count);
        const startPage = Math.min(Math.max(1, initialPage), count);
        setCurrentPage(startPage);
        setPageInputVal(String(startPage));
        setIsLoading(false);
        if (onPageChange) onPageChange(startPage, count);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error('Failed to load PDF in page viewer:', err);
        setLoadError('Unable to render PDF document pages. You can still download the complete file.');
        setIsLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
      cancelActiveRenders();
    };
  }, [yearbook.id, yearbook.fileUrl, cancelActiveRenders, initialPage, onPageChange]);

  // Jump to page if initialPage prop changes from parent
  useEffect(() => {
    if (initialPage && pdfDoc) {
      const valid = Math.min(Math.max(1, initialPage), pdfDoc.numPages);
      setCurrentPage(valid);
      setPageInputVal(String(valid));
    }
  }, [initialPage, pdfDoc]);

  // Helper to render a specific page number to a canvas
  const renderPageToCanvas = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement, scaleMultiplier: number) => {
      if (!pdfDoc) return;
      if (pageNumber < 1 || pageNumber > pdfDoc.numPages) return;

      const page = await pdfDoc.getPage(pageNumber);
      const baseScale = 1.6;
      const viewport = page.getViewport({ scale: baseScale });

      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      // Fluid responsive display size - respects aspect ratio & container height
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      context.save();
      context.scale(dpr, dpr);
      context.clearRect(0, 0, viewport.width, viewport.height);

      const renderTask = page.render({
        canvas: canvas,
        canvasContext: context,
        viewport: viewport,
      } as unknown as Parameters<typeof page.render>[0]);

      activeRenderTasksRef.current.push(renderTask);

      try {
        await renderTask.promise;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') {
          return;
        }
        console.warn('Canvas render notice:', err);
      } finally {
        context.restore();
      }
    },
    [pdfDoc]
  );

  // 2. Render Main View Canvas when currentPage, viewMode, or zoomLevel changes
  useEffect(() => {
    if (!pdfDoc || isLoading) return;

    cancelActiveRenders();
    setIsRendering(true);

    let isCancelled = false;

    async function doRender() {
      try {
        if (viewMode === 'single') {
          if (singleCanvasRef.current) {
            await renderPageToCanvas(currentPage, singleCanvasRef.current, zoomLevel);
          }
        } else {
          // Spread mode (Album Two pages side by side)
          if (currentPage === 1) {
            // Album Front Cover: single page centered
            if (singleCanvasRef.current) {
              await renderPageToCanvas(1, singleCanvasRef.current, zoomLevel);
            }
          } else {
            // Left page = even page, right page = odd page
            const leftPageNum = currentPage % 2 === 0 ? currentPage : currentPage - 1;
            const rightPageNum = leftPageNum + 1;

            const tasks: Promise<void>[] = [];
            if (leftCanvasRef.current && leftPageNum <= pdfDoc!.numPages) {
              tasks.push(renderPageToCanvas(leftPageNum, leftCanvasRef.current, zoomLevel * 0.9));
            }
            if (rightCanvasRef.current) {
              if (rightPageNum <= pdfDoc!.numPages) {
                tasks.push(renderPageToCanvas(rightPageNum, rightCanvasRef.current, zoomLevel * 0.9));
              } else {
                const ctx = rightCanvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, rightCanvasRef.current.width, rightCanvasRef.current.height);
              }
            }
            await Promise.all(tasks);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    doRender();

    return () => {
      isCancelled = true;
      cancelActiveRenders();
    };
  }, [pdfDoc, currentPage, viewMode, zoomLevel, isLoading, renderPageToCanvas, cancelActiveRenders]);

  // Page Navigation Handlers
  const goToPage = useCallback(
    (targetPage: number) => {
      if (!pdfDoc) return;
      const valid = Math.min(Math.max(1, targetPage), pdfDoc.numPages);
      setCurrentPage(valid);
      setPageInputVal(String(valid));
      if (onPageChange) onPageChange(valid, pdfDoc.numPages);
    },
    [pdfDoc, onPageChange]
  );

  const handleNext = () => {
    if (!pdfDoc) return;
    if (viewMode === 'spread') {
      if (currentPage === 1) {
        goToPage(2);
      } else {
        const currentLeft = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        const nextLeft = currentLeft + 2;
        goToPage(Math.min(nextLeft, totalPages));
      }
    } else {
      goToPage(Math.min(currentPage + 1, totalPages));
    }
  };

  const handlePrev = () => {
    if (!pdfDoc) return;
    if (viewMode === 'spread') {
      if (currentPage <= 3) {
        goToPage(1);
      } else {
        const currentLeft = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        const prevLeft = currentLeft - 2;
        goToPage(Math.max(prevLeft, 1));
      }
    } else {
      goToPage(Math.max(currentPage - 1, 1));
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      } else if (e.key === 'Home') {
        goToPage(1);
      } else if (e.key === 'End') {
        goToPage(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#020914] overflow-hidden select-none relative">
      {/* Top Toolbar for Reader View */}
      <div className="px-3 sm:px-5 py-2.5 bg-[#051329] border-b border-cyan-900/80 flex flex-wrap items-center justify-between gap-3 text-xs text-cyan-200">
        {/* Left: View Mode Toggle & Page Navigation Indicator */}
        <div className="flex items-center gap-2">
          {/* Thumbnails Toggle Button */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              showThumbnails
                ? 'bg-yellow-400 text-[#071630] border-yellow-300 font-bold'
                : 'bg-[#0b244d] text-cyan-200 border-cyan-700/60 hover:text-white'
            }`}
            title="Toggle All Page Thumbnails"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thumbnails</span>
          </button>

          {/* Single vs Spread Mode */}
          <div className="flex items-center bg-[#030d1d] rounded-lg p-0.5 border border-cyan-800/80">
            <button
              onClick={() => setViewMode('single')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-cyan-500/30 text-white font-bold'
                  : 'text-cyan-400 hover:text-white'
              }`}
              title="Single Page View"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('spread')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'spread'
                  ? 'bg-cyan-500/30 text-white font-bold'
                  : 'text-cyan-400 hover:text-white'
              }`}
              title="Two-Page Spread (Book View)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Source Badge */}
          {sourceType === 'uploaded' && (
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              Uploaded PDF Active
            </span>
          )}
        </div>

        {/* Center: Interactive Page Slider & Direct Input */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jump to First */}
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage <= 1}
            className="p-1 text-cyan-300 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="First Page (Home)"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0b244d] hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-lg border border-cyan-600/50 transition-colors cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline text-[11px]">Prev</span>
          </button>

          {/* Page Counter & Direct Input Box */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#030d1d] rounded-lg border border-cyan-800 font-mono text-xs">
            <span className="text-cyan-300">Page</span>
            <input
              type="text"
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const num = parseInt(pageInputVal, 10);
                  if (!isNaN(num)) goToPage(num);
                }
              }}
              onBlur={() => {
                const num = parseInt(pageInputVal, 10);
                if (!isNaN(num)) goToPage(num);
                else setPageInputVal(String(currentPage));
              }}
              className="w-10 text-center bg-[#071630] border border-cyan-700 rounded text-yellow-400 font-bold focus:outline-none focus:border-yellow-400"
            />
            <span className="text-cyan-400">/ {totalPages || '...'}</span>
          </div>

          {/* Range Slider for fast scrubbing */}
          {totalPages > 1 && (
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value, 10))}
              className="w-20 sm:w-28 accent-yellow-400 cursor-pointer hidden sm:block"
              title="Drag to navigate pages quickly"
            />
          )}

          {/* Next Page */}
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0b244d] hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-lg border border-cyan-600/50 transition-colors cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <span className="hidden xs:inline text-[11px]">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Jump to Last */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-1 text-cyan-300 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Last Page (End)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
            className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-cyan-200 w-10 text-center font-bold">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 15, 180))}
            className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1.5 text-cyan-400 hover:text-yellow-400 hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
            title="Reset Zoom to 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Drawer (Sidebar or Bottom Drawer) */}
        {showThumbnails && pdfDoc && (
          <div className="w-48 sm:w-60 bg-[#040e20] border-r border-cyan-900/80 flex flex-col z-20 shadow-2xl animate-fade-in shrink-0">
            <div className="p-3 border-b border-cyan-900/60 flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-yellow-400" />
                Page Thumbnails ({totalPages})
              </span>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-cyan-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                const isActive =
                  viewMode === 'single'
                    ? currentPage === pNum
                    : currentPage === 1
                    ? pNum === 1
                    : (currentPage % 2 === 0 ? currentPage : currentPage - 1) === pNum ||
                      (currentPage % 2 === 0 ? currentPage + 1 : currentPage) === pNum;

                return (
                  <button
                    key={pNum}
                    onClick={() => goToPage(pNum)}
                    className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isActive
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300 ring-1 ring-yellow-400'
                        : 'bg-[#071630] border-cyan-900/80 hover:border-cyan-500 text-cyan-300'
                    }`}
                  >
                    <div className="w-9 h-12 bg-white rounded shadow flex items-center justify-center text-[10px] text-slate-800 font-bold border border-slate-300 shrink-0">
                      {pNum === 1 ? 'Cover' : pNum}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold block">Page {pNum}</span>
                      <span className="text-[10px] text-cyan-400 truncate block">
                        {pNum === 1 ? 'Yearbook Cover' : `Historical Record`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Center: Canvas Viewing Area with Scroll & Zoom */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 bg-[#030d1d] relative">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 bg-[#071630]/90 rounded-2xl border border-cyan-700 shadow-2xl backdrop-blur-md">
              <Sparkles className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">
                Loading Yearbook Pages...
              </h3>
              <p className="text-xs text-cyan-300 font-mono">
                Extracting high-resolution pages from {yearbook.fileName || 'PDF'}
              </p>
            </div>
          )}

          {/* Rendering Spinner Overlay */}
          {isRendering && !isLoading && (
            <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-[#071630]/90 border border-cyan-500 text-cyan-300 text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <span>Rendering page {currentPage}...</span>
            </div>
          )}

          {/* Error State */}
          {loadError && (
            <div className="max-w-md text-center p-8 bg-[#071630] border border-rose-500/50 rounded-2xl shadow-2xl">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Notice Loading Document Pages</h3>
              <p className="text-xs text-cyan-200 mb-5 leading-relaxed">{loadError}</p>
              <button
                onClick={() => downloadYearbookFile(yearbook)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs rounded-xl shadow cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Original Document ({yearbook.fileSize})</span>
              </button>
            </div>
          )}

          {/* Normal Display Canvas: Single Mode OR Spread Mode Cover */}
          {!isLoading && !loadError && (
            <>
              {viewMode === 'single' || currentPage === 1 ? (
                <div
                  className="relative transition-all duration-300 flex flex-col items-center max-w-full"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Album Cover Container with Realistic Hardcover Drop Shadow & Click-to-open */}
                  <div
                    onClick={handleNext}
                    className="bg-white rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border-2 border-yellow-400/50 overflow-hidden relative cursor-pointer group hover:ring-2 hover:ring-yellow-400 transition-all max-h-[calc(88vh-200px)] flex items-center justify-center"
                    title="Click cover to open album (turn page)"
                  >
                    <canvas ref={singleCanvasRef} className="block max-h-[calc(88vh-210px)] w-auto max-w-full object-contain" />
                    {/* Hardcover album left spine shadow crease */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />
                    {/* Subtle corner sheen */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/20 to-transparent pointer-events-none" />
                    {/* Floating prompt overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="px-4 py-2 rounded-xl bg-[#071630]/95 text-yellow-300 font-bold text-xs border border-yellow-400 flex items-center gap-2 shadow-2xl backdrop-blur-sm">
                        <BookOpen className="w-4 h-4" />
                        <span>Click to Open Album Spread</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs font-mono text-cyan-200 font-semibold px-3 py-1 rounded-lg bg-[#071630] border border-cyan-800 shadow">
                      Page 1 of {totalPages} • Hardcover Album Front
                    </span>
                    {totalPages > 1 && (
                      <button
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs shadow-lg shadow-yellow-400/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Open Album (Turn Page)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Two-Page Open Album Spread Mode */
                <div
                  className="relative transition-all duration-300 flex flex-col items-center max-w-full"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center center',
                  }}
                >
                  {/* The Realistic Open Album with Central Binding Gutter Crease & Authentic Page Shadows */}
                  <div className="flex items-stretch justify-center shadow-[0_30px_80px_rgba(0,0,0,0.95)] rounded-2xl overflow-hidden border-2 border-cyan-700/60 bg-[#05142b] p-2 sm:p-3 relative max-w-[96vw] max-h-[calc(88vh-180px)]">
                    {/* Left Page (Even Page) - Click turns left/backward */}
                    <div
                      onClick={handlePrev}
                      className="bg-white relative flex-1 flex items-center justify-center cursor-pointer group overflow-hidden max-h-[calc(88vh-200px)] max-w-[48vw]"
                      title="Click left page to flip backward"
                    >
                      <canvas ref={leftCanvasRef} className="block max-h-[calc(88vh-205px)] w-auto max-w-full object-contain" />
                      {/* Central binding gutter crease shadow on right edge of left page */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/55 via-black/25 to-transparent pointer-events-none" />
                      {/* Page number pill on bottom left */}
                      <div className="absolute left-3 bottom-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono font-bold opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Page {currentPage % 2 === 0 ? currentPage : currentPage - 1}
                      </div>
                      {/* Hover turn indicator */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg backdrop-blur-sm border border-yellow-400/40">
                        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Center Spine Divider crease */}
                    <div className="w-[3px] bg-gradient-to-b from-slate-700 via-slate-900 to-slate-700 shadow-inner z-10 shrink-0" />

                    {/* Right Page (Odd Page) - Click turns right/forward */}
                    <div
                      onClick={handleNext}
                      className="bg-white relative flex-1 flex items-center justify-center cursor-pointer group overflow-hidden max-h-[calc(88vh-200px)] max-w-[48vw]"
                      title="Click right page to turn forward"
                    >
                      <canvas ref={rightCanvasRef} className="block max-h-[calc(88vh-205px)] w-auto max-w-full object-contain" />
                      {/* Central binding gutter crease shadow on left edge of right page */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/55 via-black/25 to-transparent pointer-events-none" />
                      {/* Page number pill on bottom right */}
                      <div className="absolute right-3 bottom-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono font-bold opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Page {Math.min((currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1, totalPages)}
                      </div>
                      {/* Hover turn indicator */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg backdrop-blur-sm border border-yellow-400/40">
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Album Spread Navigation & Page Indicator */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => goToPage(1)}
                      className="px-2.5 py-1 text-xs font-bold text-cyan-200 hover:text-white bg-[#071630] border border-cyan-800 hover:border-cyan-500 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                      title="Return to Cover"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Cover</span>
                    </button>

                    <button
                      onClick={handlePrev}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 text-xs font-bold text-cyan-200 hover:text-white bg-[#071630] disabled:opacity-30 border border-cyan-800 hover:border-cyan-500 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Spread</span>
                    </button>

                    <span className="text-xs font-mono text-yellow-300 font-bold px-3 py-1 rounded-md bg-[#071630] border border-yellow-400/50 shadow-sm">
                      Album Spread • Pages {currentPage % 2 === 0 ? currentPage : currentPage - 1} &{' '}
                      {Math.min((currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1, totalPages)} of {totalPages}
                    </span>

                    <button
                      onClick={handleNext}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-xs font-bold text-[#071630] bg-yellow-400 hover:bg-yellow-300 disabled:opacity-30 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>Next Spread</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
