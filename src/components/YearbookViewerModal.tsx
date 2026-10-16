/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Calendar,
  FileText,
  Tag,
  BookOpen,
  Share2,
  Check,
} from 'lucide-react';
import { Yearbook } from '../types/yearbook';
import { downloadYearbookFile } from '../utils/pdfHelper';

interface YearbookViewerModalProps {
  yearbook: Yearbook | null;
  onClose: () => void;
}

export const YearbookViewerModal: React.FC<YearbookViewerModalProps> = ({
  yearbook,
  onClose,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState<'reader' | 'pdf'>('reader');
  const [copiedLink, setCopiedLink] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!yearbook) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!yearbook) return null;

  const pages = yearbook.samplePages && yearbook.samplePages.length > 0
    ? yearbook.samplePages
    : [
        {
          pageNumber: 1,
          section: 'Cover & Title',
          title: yearbook.title,
          content: `${yearbook.year} Official Yearbook Archive. Bina Bangsa School-Pantai Indah Kapuk. ${yearbook.description}`,
        },
        {
          pageNumber: 2,
          section: 'Archival Summary',
          title: 'Preserved Historical Edition',
          content: `This yearbook contains ${yearbook.pageCount} pages of student profiles, Cambridge examination honors, athletics, musical performances, and PIK campus milestones.`,
        },
        {
          pageNumber: 3,
          section: 'Table of Contents',
          title: 'Sections & Highlights',
          content: 'Section 1: Leadership & Pastoral Address\nSection 2: Senior Class Directory\nSection 3: Cambridge & Academic Honors\nSection 4: Athletics & Cultural Shows\nSection 5: Autographs & Graduation',
        },
      ];

  const totalPagesCount = pages.length;
  const currentPage = pages[currentPageIndex] || pages[0];

  const handleNextPage = () => {
    if (currentPageIndex < totalPagesCount - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Yearbook: ${yearbook.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#030d1d]/85 backdrop-blur-md overflow-hidden"
    >
      <div
        className={`relative w-full max-w-6xl bg-[#071630] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 max-w-none rounded-none' : 'max-h-[92vh] h-[850px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-cyan-950 bg-[#040e20]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="px-2.5 py-1 rounded-lg bg-yellow-400/15 border border-yellow-400/50 text-yellow-300 font-serif font-extrabold text-xs sm:text-sm whitespace-nowrap">
              {yearbook.year}
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {yearbook.title}
              </h2>
              <p className="text-xs text-cyan-200/80 hidden sm:block truncate">
                Bina Bangsa School-Pantai Indah Kapuk • {yearbook.pageCount} Certified Pages • {yearbook.fileSize}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Toggle: Interactive Reader vs Embedded PDF */}
            <div className="hidden sm:flex bg-[#030d1d] p-0.5 rounded-lg border border-cyan-900 text-xs">
              <button
                onClick={() => setActiveTab('reader')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  activeTab === 'reader'
                    ? 'bg-yellow-400 text-[#071630]'
                    : 'text-cyan-200 hover:text-white'
                }`}
              >
                Page Reader
              </button>
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  activeTab === 'pdf'
                    ? 'bg-cyan-400 text-[#071630]'
                    : 'text-cyan-200 hover:text-white'
                }`}
              >
                PDF View
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={() => downloadYearbookFile(yearbook)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs sm:text-sm rounded-lg shadow-sm shadow-yellow-400/20 transition-all cursor-pointer"
              title="Download original yearbook PDF file"
            >
              <Download className="w-4 h-4 stroke-[2.4]" />
              <span className="hidden xs:inline">Download PDF</span>
              <span className="text-[10px] opacity-80 font-normal">({yearbook.fileSize})</span>
            </button>

            {/* Share Link */}
            <button
              onClick={handleShare}
              className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-cyan-300 hover:text-rose-400 hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer ml-1"
              title="Close Viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Viewer Canvas */}
          <div className="flex-1 bg-[#030d1d] flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden relative">
            {activeTab === 'reader' ? (
              <>
                {/* Book Page Spread Container */}
                <div
                  className="flex-1 w-full max-w-4xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                >
                  <div className="w-full max-w-3xl min-h-[440px] bg-white text-slate-900 rounded-xl shadow-2xl border-4 border-cyan-900/60 relative flex flex-col md:flex-row overflow-hidden transition-all">
                    {/* Left Page (Spine Side) */}
                    <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 bg-gradient-to-r from-slate-100/70 via-white to-white">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#071630] font-serif mb-4">
                          <span className="font-bold tracking-wider uppercase text-[#071630]">BINA BANGSA SCHOOL</span>
                          <span className="text-cyan-700 font-semibold">{yearbook.year}</span>
                        </div>

                        {currentPageIndex === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-32 h-44 rounded shadow-lg overflow-hidden border-2 border-cyan-600 mb-4 bg-[#071630]">
                              <img
                                src={yearbook.coverImageUrl}
                                alt="Cover thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs uppercase tracking-widest text-cyan-800 font-bold">
                              Pantai Indah Kapuk • Volume {yearbook.year}
                            </span>
                            <h3 className="font-serif text-xl font-bold text-[#071630] mt-1">
                              {yearbook.title}
                            </h3>
                            <p className="text-xs text-slate-600 mt-2 max-w-xs italic font-serif">
                              "{yearbook.description}"
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-800">
                              {currentPage.section}
                            </span>
                            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#071630] mt-1 mb-3">
                              {currentPage.title}
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                              {currentPage.content}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
                        <span>Page {currentPage.pageNumber || currentPageIndex + 1}</span>
                        <span className="text-[10px] uppercase tracking-wider text-cyan-800 font-bold">Gloria Dei Vivens Homo</span>
                      </div>
                    </div>

                    {/* Right Page (Highlights & Archival Record) */}
                    <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-l from-slate-100/70 via-white to-white">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#071630] font-serif mb-4">
                          <span className="font-semibold text-cyan-900">{yearbook.title}</span>
                          <span className="font-mono text-[10px] text-slate-500">PIK Archive</span>
                        </div>

                        <div className="bg-cyan-50/90 rounded-lg p-4 border border-cyan-200 text-xs text-slate-800 space-y-2.5">
                          <div className="font-bold text-[#071630] flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-700" />
                            <span>BBS PIK Archival Edition</span>
                          </div>
                          <p className="text-slate-600 text-xs leading-normal">
                            This in-browser reader displays curated highlights from the full {yearbook.pageCount}-page commemorative volume. The certified PDF file includes the complete senior roll, faculty directory, Cambridge results, and campus candids.
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => downloadYearbookFile(yearbook)}
                              className="text-cyan-800 hover:text-cyan-950 font-bold underline text-xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download full original {yearbook.fileName || 'PDF'}
                            </button>
                          </div>
                        </div>

                        {/* Interactive highlights */}
                        <div className="mt-4 space-y-2">
                          <span className="text-[11px] font-bold text-[#071630] tracking-wider uppercase">
                            Archive Category Tags
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {yearbook.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded text-[11px] bg-cyan-100 text-cyan-900 font-semibold"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
                        <span className="text-[10px] uppercase text-cyan-800 font-bold">BBS PIK Archives</span>
                        <span>Page {currentPage.pageNumber ? currentPage.pageNumber + 1 : currentPageIndex + 2}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Toolbar for Reader */}
                <div className="w-full max-w-2xl px-4 py-2 bg-[#071630] border border-cyan-800 rounded-xl flex items-center justify-between gap-3 text-xs text-cyan-200 shadow-xl">
                  {/* Prev Button */}
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0b244d] hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page indicator & slider */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      Page <strong className="text-yellow-400">{currentPageIndex + 1}</strong> of {totalPagesCount}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={totalPagesCount - 1}
                      value={currentPageIndex}
                      onChange={(e) => setCurrentPageIndex(parseInt(e.target.value, 10))}
                      className="w-24 sm:w-36 accent-yellow-400 cursor-pointer hidden xs:block"
                    />
                  </div>

                  {/* Zoom controls */}
                  <div className="hidden sm:flex items-center gap-1 text-cyan-300">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] w-9 text-center text-white">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(z + 10, 140))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex === totalPagesCount - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0b244d] hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Raw PDF / Embedded View Mode */
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {yearbook.fileUrl && yearbook.fileUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={yearbook.fileUrl}
                    title={yearbook.title}
                    className="w-full h-full rounded-lg border border-cyan-900"
                  />
                ) : (
                  <div className="max-w-md text-center p-8 bg-[#071630] border border-cyan-800 rounded-xl">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-white mb-2">
                      Full Historical Volume ({yearbook.pageCount} Pages)
                    </h3>
                    <p className="text-xs text-cyan-200/80 mb-6 leading-relaxed">
                      Official Bina Bangsa School-Pantai Indah Kapuk archival publication: <strong className="text-white">{yearbook.fileName}</strong> ({yearbook.fileSize}).
                    </p>
                    <button
                      onClick={() => downloadYearbookFile(yearbook)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold rounded-xl shadow-lg shadow-yellow-400/20 transition-all cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Certified PDF ({yearbook.fileSize})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Metadata and Chapter Browser */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-cyan-950 bg-[#071630] p-5 overflow-y-auto space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                BBS PIK Archival Record
              </span>
              <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                {yearbook.title}
              </h3>
              <p className="text-xs text-cyan-100/80 mt-2 leading-relaxed">
                {yearbook.description}
              </p>
            </div>

            {/* Quick Spec List */}
            <div className="space-y-2 text-xs border-y border-cyan-950 py-3">
              <div className="flex items-center justify-between text-cyan-200">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                  Academic Year
                </span>
                <span className="text-white font-bold">{yearbook.year}</span>
              </div>
              <div className="flex items-center justify-between text-cyan-200">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Page Count
                </span>
                <span className="text-white font-bold">{yearbook.pageCount} Pages</span>
              </div>
              <div className="flex items-center justify-between text-cyan-200">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  File Size
                </span>
                <span className="text-white font-bold">{yearbook.fileSize}</span>
              </div>
              <div className="flex items-center justify-between text-cyan-200">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-yellow-400" />
                  Format
                </span>
                <span className="text-yellow-400 font-mono font-bold">Adobe PDF 1.4</span>
              </div>
            </div>

            {/* Section Index / Jump List */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-2">
                Table of Contents & Highlights
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {pages.map((p, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentPageIndex(index);
                      setActiveTab('reader');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      currentPageIndex === index && activeTab === 'reader'
                        ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 font-bold'
                        : 'text-cyan-200 hover:text-white hover:bg-[#0b244d]'
                    }`}
                  >
                    <span className="truncate pr-2">{p.title}</span>
                    <span className="text-[10px] opacity-80 font-mono shrink-0">p.{p.pageNumber || index + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom download reminder */}
            <div className="pt-2">
              <button
                onClick={() => downloadYearbookFile(yearbook)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0b244d] hover:bg-cyan-700 text-white border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-yellow-400" />
                <span>Save Offline Copy (.PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
