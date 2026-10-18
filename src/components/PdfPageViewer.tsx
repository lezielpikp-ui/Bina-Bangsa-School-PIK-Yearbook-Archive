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

// Configure worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
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
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('single');
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

        const loadingTask = pdfjsLib.getDocument({
          data: pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData),
        });

        const doc = await loadingTask.promise;
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
      const baseScale = 1.25 * (scaleMultiplier / 100);
      const viewport = page.getViewport({ scale: baseScale });

      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.save();
      context.scale(dpr, dpr);

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
          // Expected cancellation when user clicks fast
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
          // Spread mode (Two pages side by side)
          if (currentPage === 1) {
            // Cover: single page centered
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
            if (rightCanvasRef.current && rightPageNum <= pdfDoc!.numPages) {
              tasks.push(renderPageToCanvas(rightPageNum, rightCanvasRef.current, zoomLevel * 0.9));
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
    if (viewMode === 'spread' && currentPage > 1) {
      goToPage(Math.min(currentPage + 2, totalPages));
    } else {
      goToPage(Math.min(currentPage + 1, totalPages));
    }
  };

  const handlePrev = () => {
    if (!pdfDoc) return;
    if (viewMode === 'spread' && currentPage > 2) {
      goToPage(Math.max(currentPage - 2, 1));
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
                  className="relative transition-transform duration-200 flex flex-col items-center"
                  style={{
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Page Canvas Container with Realistic Hardcover Drop Shadow */}
                  <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-cyan-800/40 overflow-hidden relative group">
                    <canvas ref={singleCanvasRef} className="block max-w-full h-auto" />
                    {/* Subtle book spine shadow on left edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 mt-2 font-semibold">
                    Page {currentPage} of {totalPages} {currentPage === 1 ? '• Cover' : ''}
                  </span>
                </div>
              ) : (
                /* Two-Page Spread Mode */
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-xl overflow-hidden border border-cyan-800/50 bg-[#071630]">
                    {/* Left Page (Even Page) */}
                    <div className="bg-white relative border-r border-slate-300">
                      <canvas ref={leftCanvasRef} className="block max-w-full h-auto" />
                      {/* Spine shadow right edge */}
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/35 to-transparent pointer-events-none" />
                    </div>

                    {/* Right Page (Odd Page) */}
                    <div className="bg-white relative">
                      <canvas ref={rightCanvasRef} className="block max-w-full h-auto" />
                      {/* Spine shadow left edge */}
                      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/35 to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 mt-2 font-semibold">
                    Pages {currentPage % 2 === 0 ? currentPage : currentPage - 1} &{' '}
                    {currentPage % 2 === 0 ? currentPage + 1 : currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
