/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Lock, LogOut, HelpCircle } from 'lucide-react';
import { AdminUser } from '../types/yearbook';

interface NavbarProps {
  currentView: 'gallery' | 'admin';
  setCurrentView: (view: 'gallery' | 'admin') => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenSetupGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  adminUser,
  onLogout,
  onOpenSetupGuide,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-950/70 bg-[#071630]/95 backdrop-blur-md shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Branding */}
          <button
            onClick={() => setCurrentView('gallery')}
            className="flex items-center gap-3.5 text-left group transition-all cursor-pointer"
          >
            {/* Suitable BBS Logo from the user's Google Drive assets */}
            <div className="h-12 px-3 py-1 bg-white rounded-xl shadow-md shadow-cyan-950/40 flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400 transition-all">
              {!logoFailed ? (
                <img
                  src="/logos/bbs_pik_logo.png"
                  alt="Bina Bangsa School Logo"
                  className="h-9 w-auto max-w-[150px] object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#071630] tracking-tight">
                  <div className="w-6 h-6 rounded-md bg-[#071630] text-[#facc15] flex items-center justify-center font-serif text-xs">
                    BBS
                  </div>
                  <span>PIK</span>
                </div>
              )}
            </div>

            {/* School Name & Campus descriptor */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg lg:text-xl tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                  Bina Bangsa School-Pantai Indah Kapuk
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#0a2347] text-cyan-300 border border-cyan-400/40 hidden md:inline-block">
                  BBS PIK
                </span>
              </div>
              <p className="text-xs text-cyan-200/80 hidden xs:block font-sans">
                Official Digital Yearbook Gallery & Archives • <span className="italic text-yellow-300/90 font-serif">Gloria Dei Vivens Homo</span>
              </p>
            </div>
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Setup & Deployment Guide Button */}
            <button
              onClick={onOpenSetupGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:text-white bg-[#0b244d] hover:bg-[#0f2e63] border border-cyan-500/30 rounded-lg transition-colors cursor-pointer"
              title="View Setup & Deployment Instructions"
            >
              <HelpCircle className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">Setup Guide</span>
            </button>

            {/* View Switcher: Public Gallery vs Admin */}
            {currentView === 'admin' ? (
              <button
                onClick={() => setCurrentView('gallery')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-lg border border-cyan-400/50 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-yellow-300" />
                <span>Return to Gallery</span>
              </button>
            ) : null}

            {/* Admin Access Button / Profile Indicator */}
            {adminUser ? (
              <div className="flex items-center gap-2 bg-[#0a244b] border border-yellow-400/40 rounded-lg px-2.5 py-1">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  <span className="hidden md:inline">Admin Dashboard</span>
                </button>
                <div className="h-4 w-px bg-yellow-400/30 mx-1"></div>
                <button
                  onClick={onLogout}
                  className="text-cyan-200 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  title="Sign out of Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('admin')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-yellow-400 text-[#071630] font-extrabold shadow-md shadow-yellow-400/25'
                    : 'bg-[#0a2347] hover:bg-[#0e2f5c] text-white border border-cyan-500/40 hover:border-cyan-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
