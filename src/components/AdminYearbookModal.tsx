/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Yearbook } from '../types/yearbook';
import { parseYearRange } from '../services/yearbookStorage';
import { generateCoverSvgDataUrl } from '../utils/coverGenerator';

interface AdminYearbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (yearbook: Yearbook) => void;
  yearbookToEdit: Yearbook | null;
}

export const AdminYearbookModal: React.FC<AdminYearbookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  yearbookToEdit,
}) => {
  const isEditing = !!yearbookToEdit;

  // Form State
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [coverSource, setCoverSource] = useState<'generate' | 'upload'>('generate');
  const [themeColor, setThemeColor] = useState<'darkBlue' | 'turquoise' | 'navyYellow' | 'midnight' | 'whiteGold' | 'royal'>('darkBlue');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState('');
  const [pageCount, setPageCount] = useState<number>(180);
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Errors & Upload Status
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Populate fields when editing or opening
  useEffect(() => {
    if (yearbookToEdit) {
      setYear(yearbookToEdit.year);
      setTitle(yearbookToEdit.title);
      setDescription(yearbookToEdit.description);
      setTheme(yearbookToEdit.theme || '');
      setCustomCoverUrl(yearbookToEdit.coverImageUrl);
      setCoverSource('upload');
      setFileName(yearbookToEdit.fileName || '');
      setFileSize(yearbookToEdit.fileSize || '42.0 MB');
      setFileSizeBytes(yearbookToEdit.fileSizeBytes || 44040192);
      setFileUrl(yearbookToEdit.fileUrl || '');
      setPageCount(yearbookToEdit.pageCount || 180);
      setTagsInput(yearbookToEdit.tags ? yearbookToEdit.tags.join(', ') : '');
      setIsFeatured(!!yearbookToEdit.featured);
    } else {
      // Default new entry
      const currentYear = new Date().getFullYear();
      setYear(`${currentYear - 1}–${currentYear}`);
      setTitle('');
      setDescription('');
      setTheme('Gloria Dei Vivens Homo');
      setCoverSource('generate');
      setThemeColor('darkBlue');
      setCustomCoverUrl('');
      setFileName('');
      setFileSize('45.0 MB');
      setFileSizeBytes(47185920);
      setFileUrl('');
      setPageCount(200);
      setTagsInput('Cambridge A-Levels, Graduation, Sports, Chapel');
      setIsFeatured(false);
    }
    setError(null);
  }, [yearbookToEdit, isOpen]);

  if (!isOpen) return null;

  // Compute live cover preview
  const activeCoverUrl =
    coverSource === 'generate'
      ? generateCoverSvgDataUrl(year || '2025', title || 'BBS PIK Yearbook', themeColor)
      : customCoverUrl || generateCoverSvgDataUrl(year || '2025', title || 'BBS PIK Yearbook', themeColor);

  // Handle Cover Image Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WebP) for the cover.');
      return;
    }

    // Limit cover image size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Cover image file exceeds 5 MB. Please use a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomCoverUrl(reader.result as string);
      setCoverSource('upload');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Main Yearbook File Upload (PDF)
  const handleMainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Yearbook document must be a PDF file (.pdf).');
      return;
    }

    // 100MB reasonable safety limit check
    const maxBytes = 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('File exceeds maximum allowed limit of 100 MB. Please compress the PDF before uploading.');
      return;
    }

    setIsProcessingFile(true);
    setFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${sizeInMb} MB`);
    setFileSizeBytes(file.size);

    if (file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setFileUrl(reader.result as string);
        setIsProcessingFile(false);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read uploaded file.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
    } else {
      setIsProcessingFile(false);
      setFileUrl('');
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!year.trim()) {
      setError('Academic Year is required (e.g., 2024–2025 or 2025).');
      return;
    }
    if (!title.trim()) {
      setError('Yearbook title / edition name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a short description or summary for the yearbook.');
      return;
    }

    const { startYear, endYear } = parseYearRange(year);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const yearbookData: Yearbook = {
      id: yearbookToEdit ? yearbookToEdit.id : `yb-bbs-${Date.now()}`,
      year: year.trim(),
      startYear,
      endYear,
      title: title.trim(),
      description: description.trim(),
      theme: theme.trim() || undefined,
      coverImageUrl: activeCoverUrl,
      fileUrl: fileUrl,
      fileName: fileName || `BBS_PIK_Yearbook_${year.replace(/[^\w-]/g, '_')}.pdf`,
      fileSize: fileSize || '45.0 MB',
      fileSizeBytes: fileSizeBytes || 47185920,
      pageCount: Number(pageCount) || 200,
      dateUploaded: yearbookToEdit ? yearbookToEdit.dateUploaded : new Date().toISOString(),
      tags: tags.length > 0 ? tags : ['Cambridge A-Levels', 'Graduation', 'Sports', 'Chapel'],
      featured: isFeatured,
      samplePages: yearbookToEdit?.samplePages || [
        {
          pageNumber: 1,
          section: 'Cover & Title',
          title: title.trim(),
          content: `${year.trim()} Official Volume. Bina Bangsa School-Pantai Indah Kapuk. ${description.trim()}`,
        },
        {
          pageNumber: 4,
          section: 'Pastoral & Principal Message',
          title: 'Walking in Wisdom and Grace',
          content: 'Gloria Dei Vivens Homo: Men live to glorify God. Celebrating our academic excellence, Christian fellowship, and vibrant community.',
        },
        {
          pageNumber: 36,
          section: 'Senior Cohort',
          title: 'Graduating Class Directory',
          content: 'Portraits, Cambridge qualifications, university destinations, and farewell quotes.',
        },
        {
          pageNumber: 92,
          section: 'Campus Achievements',
          title: 'Arts, Athletics & Student Life',
          content: 'Orchestral concerts, varsity championships, science innovation fairs, and house festivals.',
        },
      ],
    };

    try {
      onSave(yearbookData);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save yearbook entry.');
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit Yearbook' : 'Upload New Yearbook'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#030d1d]/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#071630] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950 bg-[#040e20]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white">
                {isEditing ? 'Edit Yearbook Entry' : 'Upload New Yearbook'}
              </h2>
              <p className="text-xs text-cyan-200/80 font-sans">
                Bina Bangsa School-Pantai Indah Kapuk Digital Archives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-7 space-y-4">
              {/* Year & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cyan-100 mb-1">
                    Academic Year <span className="text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2024–2025 or 2025"
                    className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-cyan-300/80 mt-1 block">
                    Format: "2024–2025" or "2025"
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-100 mb-1">
                    Yearbook Title / Edition <span className="text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. To Build The Nation"
                    className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-cyan-100 mb-1">
                  Short Description / Overview <span className="text-yellow-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the achievements, Cambridge exam honors, and theme of this graduating class..."
                  className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Cover Image Method Selector */}
              <div className="border border-cyan-900 rounded-xl p-3.5 bg-[#030d1d]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-100 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-yellow-400" />
                    Cover Artwork
                  </label>
                  <div className="flex bg-[#071630] p-0.5 rounded-lg border border-cyan-900 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCoverSource('generate')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        coverSource === 'generate'
                          ? 'bg-yellow-400 text-[#071630]'
                          : 'text-cyan-200 hover:text-white'
                      }`}
                    >
                      BBS Hardcover
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverSource('upload')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        coverSource === 'upload'
                          ? 'bg-yellow-400 text-[#071630]'
                          : 'text-cyan-200 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {coverSource === 'generate' ? (
                  <div>
                    <span className="text-[11px] text-cyan-300 block mb-1.5 font-medium">
                      Select BBS PIK Hardcover Palette (Dark Blue, Yellow, White & Turquoise):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {(
                        [
                          { key: 'darkBlue', label: 'Dark Blue' },
                          { key: 'turquoise', label: 'Turquoise' },
                          { key: 'navyYellow', label: 'Navy & Gold' },
                          { key: 'midnight', label: 'Midnight' },
                          { key: 'whiteGold', label: 'White & Gold' },
                          { key: 'royal', label: 'Royal Blue' },
                        ] as const
                      ).map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setThemeColor(c.key)}
                          className={`px-2 py-1.5 rounded-lg text-xs capitalize text-center font-bold border cursor-pointer transition-all ${
                            themeColor === c.key
                              ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                              : 'border-cyan-900 bg-[#071630] text-cyan-300 hover:text-white'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleCoverUpload}
                      className="block w-full text-xs text-cyan-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-yellow-400 file:text-[#071630] hover:file:bg-yellow-300 cursor-pointer"
                    />
                    <span className="text-[10px] text-cyan-400 mt-1 block">
                      Recommended: 800x1120px portrait ratio (PNG, JPG, or WebP).
                    </span>
                  </div>
                )}
              </div>

              {/* Main Yearbook PDF Upload */}
              <div className="border border-cyan-900 rounded-xl p-3.5 bg-[#030d1d]/90 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-100 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-yellow-400" />
                    Yearbook PDF Document <span className="text-yellow-400">*</span>
                  </label>
                  <span className="text-[10px] text-yellow-400 font-mono font-bold">Max limit: 100 MB</span>
                </div>

                <div className="relative border-2 border-dashed border-cyan-800/80 hover:border-cyan-400 rounded-xl p-4 text-center transition-colors">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleMainFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-yellow-400 mb-1" />
                    <span className="text-xs font-bold text-white">
                      {fileName ? fileName : 'Choose or Drag & Drop PDF'}
                    </span>
                    <span className="text-[10px] text-cyan-300 mt-0.5">
                      {fileName
                        ? `${fileSize} • Ready to archive`
                        : 'Upload official Bina Bangsa School-Pantai Indah Kapuk digital yearbook (.pdf)'}
                    </span>
                  </div>
                </div>

                {isProcessingFile && (
                  <p className="text-[11px] text-yellow-400 animate-pulse font-medium">
                    Reading and validating PDF document...
                  </p>
                )}
              </div>

              {/* Page Count & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cyan-100 mb-1">
                    Certified Page Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1200}
                    value={pageCount}
                    onChange={(e) => setPageCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-100 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Cambridge A-Levels, Graduation, Sports, Chapel"
                    className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Milestone Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-cyan-800 text-yellow-400 focus:ring-yellow-400 w-4 h-4 cursor-pointer accent-yellow-400"
                />
                <label htmlFor="featured-checkbox" className="text-xs text-cyan-100 cursor-pointer font-medium">
                  Mark as Milestone / Special Anniversary Edition
                </label>
              </div>
            </div>

            {/* Right Column: Live Cover Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-start bg-[#030d1d] border border-cyan-900 rounded-xl p-4">
              <div className="w-full flex items-center justify-between text-xs text-cyan-300 mb-3 border-b border-cyan-900 pb-2">
                <span className="flex items-center gap-1 font-bold text-white">
                  <Eye className="w-3.5 h-3.5 text-yellow-400" />
                  Live Hardcover Preview
                </span>
                <span className="text-[10px] text-yellow-400 uppercase font-mono font-bold">Real-time</span>
              </div>

              {/* Preview Book Hardcover */}
              <div className="relative w-44 sm:w-48 aspect-[3/4] rounded-lg shadow-2xl overflow-hidden border border-cyan-600">
                <img
                  src={activeCoverUrl}
                  alt="Live Cover Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-[#071630]/95 border border-yellow-400/50 text-yellow-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                  {year || '2025'}
                </div>
              </div>

              {/* Summary metadata */}
              <div className="mt-4 text-center w-full max-w-xs">
                <h4 className="font-serif font-bold text-sm text-white truncate">
                  {title || 'Yearbook Title Preview'}
                </h4>
                <p className="text-xs text-cyan-200/70 line-clamp-2 mt-1">
                  {description || 'Short description preview will appear here.'}
                </p>
                <div className="mt-2 text-[11px] text-yellow-400 font-mono font-bold">
                  {pageCount || 180} Pages • {fileSize || '45.0 MB'}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyan-950">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white hover:bg-[#0b244d] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs sm:text-sm shadow-lg shadow-yellow-400/20 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Publish to Gallery'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
