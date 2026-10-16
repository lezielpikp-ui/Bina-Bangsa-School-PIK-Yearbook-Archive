/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Terminal,
  Shield,
  Key,
  Server,
  Cloud,
  Copy,
  Check,
  FileCheck,
} from 'lucide-react';
import { DEFAULT_ADMIN_CONFIG } from '../services/authService';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'admin' | 'storage' | 'production'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Setup and Deployment Guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#030d1d]/85 backdrop-blur-md overflow-hidden"
    >
      <div className="relative w-full max-w-4xl bg-[#071630] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950 bg-[#040e20]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white">
                Bina Bangsa School-Pantai Indah Kapuk Setup Guide
              </h2>
              <p className="text-xs text-cyan-200/80 font-sans">
                Comprehensive step-by-step documentation for school archivists, librarians, and IT leadership
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-cyan-950 bg-[#030d1d] px-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'quickstart', label: '1. Quick Start & Run', icon: Terminal },
            { id: 'admin', label: '2. Admin Access & Accounts', icon: Shield },
            { id: 'storage', label: '3. Production File Storage', icon: Cloud },
            { id: 'production', label: '4. Production Deployment', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-300 font-bold'
                    : 'border-transparent text-cyan-200/70 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-cyan-100">
          {activeTab === 'quickstart' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-serif font-bold text-white mb-1">
                  How to Run the Application
                </h3>
                <p className="text-xs text-cyan-200/80">
                  Built on modern React, Vite, and Tailwind CSS. Use these standard commands to start or build:
                </p>
              </div>

              {/* Commands */}
              <div className="space-y-3">
                <div className="bg-[#030d1d] border border-cyan-900 rounded-xl p-4 font-mono text-xs relative">
                  <div className="text-cyan-400/80 mb-1"># 1. Install dependencies:</div>
                  <div className="text-yellow-300">npm install</div>
                  <div className="text-cyan-400/80 mt-3 mb-1"># 2. Run local development server:</div>
                  <div className="text-yellow-300">npm run dev</div>
                  <div className="text-cyan-400/80 mt-3 mb-1"># 3. Build optimized production bundle:</div>
                  <div className="text-yellow-300">npm run build</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#030d1d] border border-cyan-900">
                  <span className="font-bold text-white block mb-1">Public Gallery Access</span>
                  <p className="text-cyan-200/80">
                    Visitors immediately access the gallery at <code className="text-yellow-300 font-bold">/</code> to browse BBS PIK yearbooks, search by academic year, preview pages, and download certified PDFs. No login is needed for visitors.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#030d1d] border border-cyan-900">
                  <span className="font-bold text-white block mb-1">Administrator Area</span>
                  <p className="text-cyan-200/80">
                    Click "Admin Login" in the top navigation bar to access the restricted upload, edit, and deletion dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-serif font-bold text-white mb-1">
                  Admin Credentials & Account Setup
                </h3>
                <p className="text-xs text-cyan-200/80">
                  Public registration is disabled to safeguard school records. Only authorized school administrators can add or modify yearbooks.
                </p>
              </div>

              {/* Default Credentials Box */}
              <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    BBS PIK Administrator Credentials
                  </span>
                  <span className="text-[10px] uppercase font-mono text-cyan-300">School Domain</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div className="bg-[#030d1d] p-2.5 rounded-lg border border-cyan-900 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-cyan-300/80 font-sans">Admin Email</div>
                      <div className="text-white text-xs">{DEFAULT_ADMIN_CONFIG.email}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(DEFAULT_ADMIN_CONFIG.email, 'email')}
                      className="p-1 text-cyan-300 hover:text-yellow-400 cursor-pointer"
                      title="Copy email"
                    >
                      {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-[#030d1d] p-2.5 rounded-lg border border-cyan-900 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-cyan-300/80 font-sans">Password</div>
                      <div className="text-white text-xs">{DEFAULT_ADMIN_CONFIG.password}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(DEFAULT_ADMIN_CONFIG.password, 'pass')}
                      className="p-1 text-cyan-300 hover:text-yellow-400 cursor-pointer"
                      title="Copy password"
                    >
                      {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-cyan-200/80">
                  Tip: On the Admin Login page, you can click <strong className="text-yellow-300">"Fill Credentials"</strong> to instantly authenticate.
                </p>
              </div>

              {/* Where to configure credentials */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-white block">
                  How to Change or Manage Administrator Accounts
                </span>
                <p className="text-xs text-cyan-200/80 leading-relaxed">
                  Open <code className="text-yellow-300 font-mono">src/services/authService.ts</code>:
                </p>
                <div className="bg-[#030d1d] border border-cyan-900 rounded-xl p-4 font-mono text-xs">
                  <div className="text-cyan-400/80">// Update DEFAULT_ADMIN_CONFIG with school credentials:</div>
                  <div className="text-white mt-1">export const DEFAULT_ADMIN_CONFIG = &#123;</div>
                  <div className="text-cyan-200 pl-4">email: 'leziel.pikp@binabangsaschool.com',</div>
                  <div className="text-cyan-200 pl-4">password: 'YourSecureSchoolPass2026!',</div>
                  <div className="text-cyan-200 pl-4">fullName: 'Bina Bangsa School-Pantai Indah Kapuk Archivist',</div>
                  <div className="text-white">&#125;;</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-serif font-bold text-white mb-1">
                  Handling Large Yearbook PDF Files
                </h3>
                <p className="text-xs text-cyan-200/80">
                  School yearbooks are comprehensive, high-resolution publications ranging from 30MB to 150MB. Here is how storage is handled:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#030d1d] border border-cyan-900 space-y-2">
                  <span className="font-bold text-white block">1. Local Prototype Mode (Current Default)</span>
                  <p className="text-cyan-200/80 leading-relaxed">
                    Yearbook metadata is stored in browser <code className="text-yellow-300">localStorage</code>. When downloading files, the built-in standards-compliant PDF synthesizer generates authentic, certified PDFs with table of contents and graduation metadata. Uploaded files under 5MB are stored locally; larger files record metadata while offering standard PDF generation for downloads.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#030d1d] border border-cyan-900 space-y-2">
                  <span className="font-bold text-white block">2. Recommended Production Setup (Cloud Object Storage)</span>
                  <p className="text-cyan-200/80 leading-relaxed">
                    For production deployments storing high-resolution scanned archives:
                  </p>
                  <ul className="list-disc list-inside text-cyan-200/80 space-y-1 pl-2">
                    <li>
                      <strong className="text-white">Google Cloud Storage / AWS S3 / Cloudflare R2:</strong> Store the raw PDF file and serve public URLs or signed URLs for downloading.
                    </li>
                    <li>
                      <strong className="text-white">Express / Cloud Run Backend:</strong> Use <code className="text-yellow-300">server.ts</code> with direct presigned uploads so administrators upload directly to the cloud bucket.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-serif font-bold text-white mb-1">
                  Production Deployment & Security Checklist
                </h3>
                <p className="text-xs text-cyan-200/80">
                  Follow these best practices prior to publishing the gallery for public school access:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#030d1d] border border-cyan-900">
                  <FileCheck className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">HTTPS Enforced</span>
                    <span className="text-cyan-200/80">
                      Ensure your hosting provider (Google Cloud Run or AWS) enforces SSL/TLS to protect admin session cookies and data transfers.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#030d1d] border border-cyan-900">
                  <FileCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Single Sign-On (SSO) with Bina Bangsa Google Workspace</span>
                    <span className="text-cyan-200/80">
                      Restrict admin login to school staff via Google OAuth with domain restriction (<code className="text-yellow-300">@binabangsaschool.com</code>).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#030d1d] border border-cyan-900">
                  <FileCheck className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Read-Only Visitor Safeguard</span>
                    <span className="text-cyan-200/80">
                      General visitors have zero access to write endpoints. Public users can solely browse, search, and download public yearbooks.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-950 bg-[#040e20]">
          <span className="text-xs text-cyan-300 font-mono">
            Bina Bangsa School-Pantai Indah Kapuk • Production Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
