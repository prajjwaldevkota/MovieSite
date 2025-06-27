"use client";
import "./globals.css";
import type { Metadata } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const showNavigation = pathname !== "/home" && pathname !== "/";

  const handleHome = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push('/');
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const handleBack = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.back();
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white min-h-screen font-sans antialiased">
        {showNavigation && (
          <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
            {/* Home Button */}
            <button
              onClick={handleHome}
              disabled={isNavigating}
              className="glass-nav-button p-3 rounded-2xl border border-white/20 hover:scale-105 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go Home"
            >
              <svg className="w-6 h-6 text-orange-300 group-hover:text-orange-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-3 0V8a1 1 0 011-1h2a1 1 0 011 1v3" />
              </svg>
            </button>
            
            {/* Back Button */}
            <button
              onClick={handleBack}
              disabled={isNavigating}
              className="glass-nav-button p-3 rounded-2xl border border-white/20 hover:scale-105 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go Back"
            >
              <svg className="w-6 h-6 text-orange-300 group-hover:text-orange-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Navigation Indicator */}
            {isNavigating && (
              <div className="glass-nav-button px-3 py-2 rounded-2xl border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-orange-300">Loading...</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {children}

        <style jsx global>{`
          .glass-nav-button {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            box-shadow: 
              0 8px 32px 0 rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .glass-nav-button:hover:not(:disabled) {
            background: rgba(251, 146, 60, 0.2);
            box-shadow: 
              0 12px 40px 0 rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
          }

          .glass-nav-button:disabled {
            transform: none !important;
          }
        `}</style>
      </body>
    </html>
  );
}