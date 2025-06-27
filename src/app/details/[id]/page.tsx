"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import tmdb from "../../../api/tmdb";

interface Episode {
  episode_number: number;
  name: string;
}

const API_KEY = "07871a74a8d65cd2e1342eaf26324e65";

export default function Details({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [details, setDetails] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [showPlayer, setShowPlayer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState("vidfast");
  const [showServerSelector, setShowServerSelector] = useState(false);

  const movieServers = [
    { id: "vidfast", name: "Vidfast (Default)", url: `https://vidfast.pro/movie/${id}` },
    { id: "vidsrc1", name: "Vidsrc API 1", url: `https://vidsrc.wtf/api/1/movie/?id=${id}&color=00ff00` },
    { id: "vidsrc2", name: "Vidsrc API 2", url: `https://vidsrc.wtf/api/2/movie/?id=${id}&color=00ff00` },
    { id: "vidsrc3", name: "Vidsrc API 3", url: `https://vidsrc.wtf/api/3/movie/?id=${id}` },
    { id: "vidsrc4", name: "Vidsrc API 4", url: `https://vidsrc.wtf/api/4/movie/?id=${id}` },
  ];

  const seriesServers = [
    { id: "vidfast", name: "Vidfast (Default)", url: `https://vidfast.pro/tv/${id}/${selectedSeason}/${selectedEpisode}?autoPlay=true` },
    { id: "vidsrc1", name: "Vidsrc API 1", url: `https://vidsrc.wtf/api/1/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}&color=00ff00` },
    { id: "vidsrc2", name: "Vidsrc API 2", url: `https://vidsrc.wtf/api/2/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}&color=00ff00` },
    { id: "vidsrc3", name: "Vidsrc API 3", url: `https://vidsrc.wtf/api/3/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}` },
    { id: "vidsrc4", name: "Vidsrc API 4", url: `https://vidsrc.wtf/api/4/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}` },
  ];

  const currentMovieServer = movieServers.find(s => s.id === selectedServer) || movieServers[0];
  const currentSeriesServer = seriesServers.find(s => s.id === selectedServer) || seriesServers[0];

  // Get current server URL based on type
  const getCurrentServerUrl = () => {
    if (type === "movie") {
      return currentMovieServer.url;
    } else {
      const server = seriesServers.find(s => s.id === selectedServer) || seriesServers[0];
      return server.url.replace(`${id}/${selectedSeason}/${selectedEpisode}`, `${details?.id}/${selectedSeason}/${selectedEpisode}`);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      if (type === "movie") {
        const res = await tmdb.get(`/movie/${id}`, {
          params: {
            api_key: API_KEY,
            language: "en-US",
          },
        });
        setDetails(res.data);
        const rec = await tmdb.get(`/movie/${id}/recommendations`, {
          params: {
            api_key: API_KEY,
            language: "en-US",
          },
        });
        setRecommendations(rec.data.results || []);
      } else {
        const res = await tmdb.get(`/tv/${id}`, {
          params: {
            api_key: API_KEY,
            language: "en-US",
          },
        });
        setDetails(res.data);
        setSeasons(res.data.seasons || []);
        if (res.data.seasons && res.data.seasons.length > 0) {
          fetchEpisodes(res.data.id, res.data.seasons[0].season_number);
        }
      }
      setLoading(false);
    };
    fetchDetails();
    // eslint-disable-next-line
  }, [id, type]);

  const fetchEpisodes = async (tvId: string, seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
    setEpisodes([]);
    const res = await tmdb.get(`/tv/${tvId}/season/${seasonNumber}`, {
      params: {
        api_key: API_KEY,
        language: "en-US",
      },
    });
    setEpisodes(res.data.episodes || []);
  };

  // Apple liquid glass skeleton loader
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white p-4">
        <div className="w-full h-full liquid-glass animate-pulse flex flex-col gap-8 p-8 rounded-3xl">
          <div className="h-80 bg-white/10 rounded-2xl mb-4 glass-surface" />
          <div className="h-8 w-2/3 bg-white/15 rounded-xl mb-2 glass-surface" />
          <div className="h-5 w-1/3 bg-white/10 rounded-lg mb-4 glass-surface" />
          <div className="h-4 w-1/2 bg-white/10 rounded-lg mb-2 glass-surface" />
          <div className="h-4 w-1/3 bg-white/10 rounded-lg mb-2 glass-surface" />
          <div className="h-4 w-1/4 bg-white/10 rounded-lg mb-6 glass-surface" />
          <div className="h-6 w-1/4 bg-white/15 rounded-xl mb-4 glass-surface" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-white/10 rounded-2xl glass-surface" />
            ))}
          </div>
        </div>
        <style jsx global>{`
          .glass-border {
            box-shadow:
              0 8px 32px 0 rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      
      {/* Control Buttons - Top Right */}
      <div className="fixed top-4 right-4 z-100 flex gap-3">
        {/* Server Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowServerSelector(!showServerSelector)}
            className="glass-nav-button px-4 py-3 rounded-2xl border border-white/20 hover:scale-105 transition-all duration-300 text-orange-300 hover:text-orange-200 font-medium flex items-center gap-2"
          >
            
            Server: {(type === "movie" ? currentMovieServer.name : currentSeriesServer.name).replace(" (Default)", "")}
          </button>
          
          {/* Server Dropdown */}
          {showServerSelector && (
            <div className="absolute top-full right-0 mt-2 w-41 liquid-glass-dropdown rounded-2xl border border-white/20 overflow-hidden shadow-2xl backdrop-blur-3xl">
              <div className="p-4 border-b border-white/20 glass-header">
                <div className="text-sm font-medium text-orange-200 px-2 py-1">Select Server:</div>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scroll">
                {(type === "movie" ? movieServers : seriesServers).map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      setSelectedServer(server.id);
                      setShowServerSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 transition-all duration-150 border-b border-white/10 last:border-b-0 glass-server-item ${
                      selectedServer === server.id 
                        ? "glass-server-active" 
                        : "glass-server-inactive"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{server.name}</span>
                      {selectedServer === server.id && (
                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Player Button */}
        <button
          onClick={() => setShowPlayer(!showPlayer)}
          className="glass-nav-button px-4 py-3 rounded-2xl border border-white/20 hover:scale-105 transition-all duration-300 text-orange-300 hover:text-orange-200 font-medium"
        >
          {showPlayer ? 'Hide Player' : 'Show Player'}
        </button>
      </div>

      {/* Click outside to close server selector */}
      {showServerSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowServerSelector(false)}
        />
      )}

      <div className="w-full h-full liquid-glass flex flex-col gap-6 p-6 pt-8 rounded-3xl shadow-2xl">
        
        {/* Video Player - Reduced size */}
        {showPlayer && (
          <div className="w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 glass-border">
            <iframe
              key={`${selectedServer}-${selectedSeason}-${selectedEpisode}`}
              src={getCurrentServerUrl()}
              allowFullScreen
              allow="autoplay; fullscreen"
              className="w-full h-full min-h-[320px] bg-black/80 rounded-2xl"
              style={{ backdropFilter: 'blur(20px)' }}
            />
          </div>
        )}

        {/* Current Server Display */}
        {showPlayer && (
          <div className="w-full max-w-4xl mx-auto">
            <div className="glass-pill px-4 py-2 rounded-xl border border-white/20 text-center">
              <span className="text-orange-200 text-sm font-medium">
                Currently playing from: {(type === "movie" ? currentMovieServer.name : currentSeriesServer.name)}
              </span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
          
          {/* Left Side - Poster and Basic Info */}
          <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
            <img
              src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : "/no-poster.png"}
              alt={details.title || details.name}
              className="rounded-2xl w-64 h-96 object-cover shadow-2xl border border-white/20 glass-image mb-4"
            />
            <div className="text-center lg:text-left">
              <div className="text-orange-100 text-lg mb-2 font-medium">
                {details.release_date ? details.release_date.slice(0, 4) : details.first_air_date ? details.first_air_date.slice(0, 4) : ""}
              </div>
              {details.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {details.genres.map((genre: any) => (
                    <span key={genre.id} className="px-3 py-1 rounded-full text-sm glass-pill border border-white/20 text-orange-200">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Title, Description, and Controls */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Title and Description */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl mb-4">
                {details.title || details.name}
              </h1>
              <p className="text-white/90 text-lg leading-relaxed max-w-4xl">{details.overview}</p>
            </div>

            {/* TV Series Controls */}
            {type !== "movie" && (
              <div className="flex flex-col gap-6">
                
                {/* Season Selector - Horizontal Pills */}
                <div>
                  <label className="font-semibold text-orange-200 mb-3 block text-lg">Seasons:</label>
                  <div className="flex gap-3 overflow-x-auto pb-3 pt-2 custom-scroll">
                    {seasons.map((season: any) => (
                      <button
                        key={season.id}
                        className={`px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-500 border flex-shrink-0 ${
                          selectedSeason === season.season_number 
                            ? "liquid-glass-selected text-white shadow-2xl border-orange-400/60 scale-110 transform-gpu" 
                            : "glass-surface text-white/90 hover:bg-orange-500/20 hover:border-orange-400/40 hover:scale-105 border-white/20"
                        }`}
                        onClick={() => fetchEpisodes(details.id, season.season_number)}
                      >
                        <span className="relative z-10">{season.name}</span>
                        {selectedSeason === season.season_number && (
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-600/30 rounded-full blur-sm animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Episode Selector */}
                <div>
                  <label className="font-semibold text-orange-200 mb-3 block text-lg">Episodes:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-96 overflow-y-auto custom-scroll pr-2 pt-2">
                    {episodes.map((ep) => (
                      <button
                        key={ep.episode_number}
                        className={`p-4 rounded-2xl font-semibold text-sm transition-all duration-500 border relative overflow-hidden ${
                          selectedEpisode === ep.episode_number 
                            ? "liquid-glass-selected text-white shadow-2xl border-orange-400/60 scale-105 transform-gpu" 
                            : "glass-surface text-white/90 hover:bg-orange-500/20 hover:border-orange-400/40 hover:scale-102 border-white/20"
                        }`}
                        onClick={() => { setSelectedEpisode(ep.episode_number); setShowPlayer(true); }}
                      >
                        <div className="relative z-10">
                          <div className="text-orange-300 font-bold mb-1">EP {ep.episode_number}</div>
                          <div className="line-clamp-2 text-xs">{ep.name}</div>
                        </div>
                        {selectedEpisode === ep.episode_number && (
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-600/30 rounded-2xl blur-sm animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Movie Recommendations */}
            {type === "movie" && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-orange-100">You might also like</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {recommendations.length === 0 ? (
                    <div className="col-span-full text-white/70 text-center py-8">No recommendations found.</div>
                  ) : (
                    recommendations.map((rec) => (
                      <div key={rec.id} className="glass-card rounded-2xl p-3 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-white/20">
                        <img
                          src={rec.poster_path ? `https://image.tmdb.org/t/p/w200${rec.poster_path}` : "/no-poster.png"}
                          alt={rec.title}
                          className="w-full h-32 object-cover rounded-xl mb-2 border border-white/20 shadow-lg"
                        />
                        <div className="text-center text-xs font-semibold line-clamp-2 text-white/90">{rec.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .liquid-glass {
          background: rgba(15, 23, 42, 0.4);
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .liquid-glass-dropdown {
          background: rgba(15, 23, 42, 0.3);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border-radius: 16px;
        }
        
        .glass-header {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        
        .glass-server-item {
          position: relative;
          overflow: hidden;
          transition: all 0.15s ease-out;
        }
        
        .glass-server-inactive {
          background: rgba(255, 255, 255, 0.02);
          color: rgba(255, 255, 255, 0.9);
          transition: all 0.15s ease-out;
        }
        
        .glass-server-inactive:hover {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(251, 146, 60, 0.9);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: translateX(2px);
        }
        
        .glass-server-active {
          background: rgba(251, 146, 60, 0.15);
          color: rgba(251, 146, 60, 1);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 20px rgba(251, 146, 60, 0.2);
          font-weight: 600;
        }
        
        .liquid-glass-selected {
          background: rgba(251, 146, 60, 0.25);
          backdrop-filter: blur(30px) saturate(200%);
          -webkit-backdrop-filter: blur(30px) saturate(200%);
          box-shadow: 
            0 20px 40px -12px rgba(251, 146, 60, 0.4),
            0 0 0 1px rgba(251, 146, 60, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .liquid-glass-selected::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        .glass-surface {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        
        .glass-image {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .glass-pill {
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 
            0 4px 16px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .glass-nav-button {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 
            0 8px 32px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-nav-button:hover {
          background: rgba(251, 146, 60, 0.2);
          box-shadow: 
            0 12px 40px 0 rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Custom scrollbar styles */
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(251, 146, 60, 0.6);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 146, 60, 0.8);
        }

        /* Firefox scrollbar */
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(251, 146, 60, 0.6) rgba(255, 255, 255, 0.1);
        }

        /* Utility classes */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}