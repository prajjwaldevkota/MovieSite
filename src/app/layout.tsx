"use client";
import "./globals.css";
import type { Metadata } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const homeButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  
  const showNavigation = pathname !== "/home" && pathname !== "/";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse tracking for liquid glass effect
  useEffect(() => {
    const handleMouseMove = (button: HTMLButtonElement) => (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      button.style.setProperty('--mouse-x', `${x}%`);
      button.style.setProperty('--mouse-y', `${y}%`);
    };

    const handleMouseLeave = (button: HTMLButtonElement) => () => {
      button.style.removeProperty('--mouse-x');
      button.style.removeProperty('--mouse-y');
    };

    const buttons = [homeButtonRef.current, backButtonRef.current].filter(Boolean) as HTMLButtonElement[];
    
    buttons.forEach(button => {
      const mouseMoveHandler = handleMouseMove(button);
      const mouseLeaveHandler = handleMouseLeave(button);
      
      button.addEventListener('mousemove', mouseMoveHandler);
      button.addEventListener('mouseleave', mouseLeaveHandler);
      
      return () => {
        button.removeEventListener('mousemove', mouseMoveHandler);
        button.removeEventListener('mouseleave', mouseLeaveHandler);
      };
    });
  }, [showNavigation]);

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
      <head>
        <title>CineStream - Discover Movies & Series</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white min-h-screen font-sans antialiased">
        {/* Ambient light source */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-orange-500/10 via-transparent to-transparent animate-ambient-shift"></div>
        </div>

        {showNavigation && (
          <div className={`fixed top-6 left-6 z-50 flex items-center gap-3 transition-all duration-300 ${isScrolled ? 'translate-y-[-120px] opacity-0' : 'translate-y-0 opacity-100'}`}>
            {/* Home Button */}
            <button
              ref={homeButtonRef}
              onClick={handleHome}
              disabled={isNavigating}
              className="liquid-glass-button p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10 hover:scale-105 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-xl relative overflow-hidden"
              title="Go Home"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-300 group-hover:text-orange-200 transition-colors relative z-10 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-3 0V8a1 1 0 011-1h2a1 1 0 011 1v3" />
              </svg>
            </button>
            
            {/* Back Button */}
            <button
              ref={backButtonRef}
              onClick={handleBack}
              disabled={isNavigating}
              className="liquid-glass-button p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10 hover:scale-105 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-xl relative overflow-hidden"
              title="Go Back"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-300 group-hover:text-orange-200 transition-colors relative z-10 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Navigation Indicator */}
            {isNavigating && (
              <div className="glass-nav-indicator px-3 py-2 rounded-2xl border border-white/20">
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
          @keyframes ambient-shift {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(20px, 10px) rotate(1deg); }
          }

          @keyframes liquid-flow {
            0%, 100% { transform: translateX(0%) translateY(0%) rotate(30deg); }
            50% { transform: translateX(10%) translateY(-10%) rotate(35deg); }
          }

          .animate-ambient-shift {
            animation: ambient-shift 8s ease-in-out infinite;
          }

          .liquid-glass-button {
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(20px) saturate(180%) brightness(120%);
            -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(120%);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Primary liquid reflection */
          .liquid-glass-button::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              transparent 30%,
              rgba(255, 255, 255, 0.1) 40%,
              rgba(255, 255, 255, 0.3) 50%,
              rgba(251, 146, 60, 0.2) 55%,
              rgba(255, 255, 255, 0.1) 60%,
              transparent 70%
            );
            transform: translateX(-100%) translateY(-100%) rotate(30deg);
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
            z-index: 1;
          }

          /* Mouse-responsive shimmer */
          .liquid-glass-button::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(251, 146, 60, 0.2) 0%,
              rgba(255, 255, 255, 0.1) 20%,
              transparent 50%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            border-radius: inherit;
            z-index: 1;
          }

          .liquid-glass-button:hover:not(:disabled) {
            transform: translateY(-2px) scale(1.02);
            border-color: rgba(251, 146, 60, 0.3);
            background: rgba(251, 146, 60, 0.15);
            box-shadow: 
              0 16px 48px rgba(0, 0, 0, 0.4),
              0 8px 24px rgba(251, 146, 60, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          }

          .liquid-glass-button:hover:not(:disabled)::before {
            transform: translateX(0%) translateY(0%) rotate(30deg);
            animation: liquid-flow 2s ease-in-out infinite;
          }

          .liquid-glass-button:hover:not(:disabled)::after {
            opacity: 1;
          }

          .liquid-glass-button:active:not(:disabled) {
            transform: translateY(0) scale(0.98);
            background: rgba(251, 146, 60, 0.25);
          }

          .liquid-glass-button:disabled {
            transform: none !important;
            background: rgba(15, 23, 42, 0.3) !important;
          }

          .liquid-glass-button:disabled::before,
          .liquid-glass-button:disabled::after {
            display: none;
          }

          .glass-nav-indicator {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          /* Gradient utilities */
          .bg-gradient-radial {
            background-image: radial-gradient(var(--tw-gradient-stops));
          }
        `}</style>
      </body>
    </html>
  );
}