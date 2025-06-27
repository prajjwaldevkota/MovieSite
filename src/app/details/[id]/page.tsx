"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Head from "next/head";

interface Episode {
  episode_number: number;
  name: string;
}

export default function Details({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  const movieServers = [
    {
      id: "vidfast",
      name: "Vidfast (Default)",
      url: `https://vidfast.pro/movie/${id}`,
    },
    {
      id: "vidsrc1",
      name: "Vidsrc API 1",
      url: `https://vidsrc.wtf/api/1/movie/?id=${id}&color=00ff00`,
    },
    {
      id: "vidsrc2",
      name: "Vidsrc API 2",
      url: `https://vidsrc.wtf/api/2/movie/?id=${id}&color=00ff00`,
    },
    {
      id: "vidsrc3",
      name: "Vidsrc API 3",
      url: `https://vidsrc.wtf/api/3/movie/?id=${id}`,
    },
    {
      id: "vidsrc4",
      name: "Vidsrc API 4",
      url: `https://vidsrc.wtf/api/4/movie/?id=${id}`,
    },
  ];

  const seriesServers = [
    {
      id: "vidfast",
      name: "Vidfast (Default)",
      url: `https://vidfast.pro/tv/${id}/${selectedSeason}/${selectedEpisode}?autoPlay=true`,
    },
    {
      id: "vidsrc1",
      name: "Vidsrc API 1",
      url: `https://vidsrc.wtf/api/1/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}&color=00ff00`,
    },
    {
      id: "vidsrc2",
      name: "Vidsrc API 2",
      url: `https://vidsrc.wtf/api/2/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}&color=00ff00`,
    },
    {
      id: "vidsrc3",
      name: "Vidsrc API 3",
      url: `https://vidsrc.wtf/api/3/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}`,
    },
    {
      id: "vidsrc4",
      name: "Vidsrc API 4",
      url: `https://vidsrc.wtf/api/4/tv/?id=${id}&s=${selectedSeason}&e=${selectedEpisode}`,
    },
  ];

  const currentMovieServer =
    movieServers.find((s) => s.id === selectedServer) || movieServers[0];
  const currentSeriesServer =
    seriesServers.find((s) => s.id === selectedServer) || seriesServers[0];

  // Get current server URL based on type
  const getCurrentServerUrl = () => {
    if (type === "movie") {
      return currentMovieServer.url;
    } else {
      const server =
        seriesServers.find((s) => s.id === selectedServer) || seriesServers[0];
      return server.url.replace(
        `${id}/${selectedSeason}/${selectedEpisode}`,
        `${details?.id}/${selectedSeason}/${selectedEpisode}`
      );
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      if (type === "movie") {
        const res = await fetch(`/api/tmdb/movie/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queryParams: { language: "en-US" } }),
        });
        const data = await res.json();
        setDetails(data);
        const recRes = await fetch(`/api/tmdb/movie/${id}/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queryParams: { language: "en-US" } }),
        });
        const recData = await recRes.json();
        setRecommendations((recData.results || []).map((item: any) => ({ ...item, media_type: "movie" })));
      } else {
        const res = await fetch(`/api/tmdb/tv/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queryParams: { language: "en-US" } }),
        });
        const data = await res.json();
        setDetails(data);
        setSeasons(data.seasons || []);
        if (data.seasons && data.seasons.length > 0) {
          fetchEpisodes(data.id, data.seasons[0].season_number);
        }
        const recRes = await fetch(`/api/tmdb/tv/${id}/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queryParams: { language: "en-US" } }),
        });
        const recData = await recRes.json();
        setRecommendations((recData.results || []).map((item: any) => ({ ...item, media_type: "tv" })));
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
    const res = await fetch(`/api/tmdb/tv/${tvId}/season/${seasonNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryParams: { language: "en-US" } }),
    });
    const data = await res.json();
    setEpisodes(data.episodes || []);
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
              <div
                key={i}
                className="h-40 bg-white/10 rounded-2xl glass-surface"
              />
            ))}
          </div>
        </div>
        <style jsx global>{`
          .glass-border {
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{details?.title || details?.name || 'CineStream'}</title>
      </Head>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Control Buttons - Top Right with scroll hide animation */}
        <div
          className={`fixed top-4 right-4 z-50 flex gap-2 sm:gap-3 transition-all duration-300 ${
            isScrolled
              ? "transform translate-y-[-120px] opacity-0"
              : "transform translate-y-0 opacity-100"
          }`}
        >
          {/* Server Selector Button */}
          <div className="relative">
            <button
              onClick={() => setShowServerSelector(!showServerSelector)}
              className="glass-nav-button px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-white/20 hover:scale-105 transition-all duration-300 text-orange-300 hover:text-orange-200 font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Server:</span>
              <span className="sm:hidden">S:</span>
              <span className="max-w-[60px] sm:max-w-none truncate">
                {(type === "movie"
                  ? currentMovieServer.name
                  : currentSeriesServer.name
                ).replace(" (Default)", "")}
              </span>
            </button>

            {/* Server Dropdown */}
            {showServerSelector && (
              <div className="absolute top-full right-0 mt-2 w-48 sm:w-48 liquid-glass-dropdown rounded-xl sm:rounded-2xl border border-white/20 overflow-hidden shadow-2xl backdrop-blur-3xl">
                <div className="p-3 sm:p-4 border-b border-white/20 glass-header">
                  <div className="text-xs sm:text-sm font-medium text-orange-200 px-2 py-1">
                    Select Server:
                  </div>
                </div>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto custom-scroll">
                  {(type === "movie" ? movieServers : seriesServers).map(
                    (server) => (
                      <button
                        key={server.id}
                        onClick={() => {
                          setSelectedServer(server.id);
                          setShowServerSelector(false);
                        }}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 transition-all duration-150 border-b border-white/10 last:border-b-0 glass-server-item ${
                          selectedServer === server.id
                            ? "glass-server-active"
                            : "glass-server-inactive"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium">
                            {server.name}
                          </span>
                          {selectedServer === server.id && (
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Player Button */}
          <button
            onClick={() => setShowPlayer(!showPlayer)}
            className="glass-nav-button px-2 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-white/20 hover:scale-105 transition-all duration-300 text-orange-300 hover:text-orange-200 font-medium text-xs sm:text-sm"
          >
            {showPlayer ? "Hide" : "Show"}
          </button>
        </div>

        {/* Click outside to close server selector */}
        {showServerSelector && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowServerSelector(false)}
          />
        )}

        <div className="w-full min-h-screen p-3 sm:p-4 lg:p-6">
          <div className="w-full liquid-glass flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 pt-16 sm:pt-20 rounded-2xl sm:rounded-3xl shadow-2xl">
            {/* Video Player - Mobile optimized with margin */}
            {showPlayer && (
              <div className="w-full max-w-full sm:max-w-4xl lg:max-w-5xl mx-auto mt-3 sm:mt-2 lg:mt-1">
                <div className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/20 glass-border flex justify-center items-center">
                  <iframe
                    key={`${selectedServer}-${selectedSeason}-${selectedEpisode}`}
                    src={getCurrentServerUrl()}
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    className="w-full h-full min-h-[100px] sm:min-h-[300px] lg:min-h-[250px] xl:min-h-[300px] bg-black/80 rounded-xl sm:rounded-2xl"
                    style={{ backdropFilter: "blur(20px)" }}
                  />
                </div>
              </div>
            )}

            {/* Current Server Display */}
            {showPlayer && (
              <div className="w-full mx-auto">
                <div className="glass-pill px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/20 text-center">
                  <span className="text-orange-200 text-xs sm:text-sm font-medium">
                    Playing from:{" "}
                    {type === "movie"
                      ? currentMovieServer.name
                      : currentSeriesServer.name}
                  </span>
                </div>
              </div>
            )}

            {/* Main Content Grid - Mobile responsive */}
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8 flex-1">
              {/* Top/Left Side - Poster and Basic Info */}
              <div className="lg:col-span-1 flex flex-col sm:flex-row lg:flex-col items-center gap-4 sm:gap-6">
                <img
                  src={
                    details.poster_path
                      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                      : "/no-poster.png"
                  }
                  alt={details.title || details.name}
                  className="rounded-xl sm:rounded-2xl w-40 sm:w-48 lg:w-64 h-60 sm:h-72 lg:h-96 object-cover shadow-2xl border border-white/20 glass-image flex-shrink-0"
                />
                <div className="text-center sm:text-left lg:text-center flex-1">
                  <div className="text-orange-100 text-base sm:text-lg mb-2 font-medium">
                    {details.release_date
                      ? details.release_date.slice(0, 4)
                      : details.first_air_date
                      ? details.first_air_date.slice(0, 4)
                      : ""}
                  </div>
                  {details.genres && details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start lg:justify-center">
                      {details.genres.map((genre: { id: number; name: string }) => (
                        <span
                          key={genre.id}
                          className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm glass-pill border border-white/20 text-orange-200"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Title, Description, and Controls */}
              <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6">
                {/* Title and Description */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl mb-3 sm:mb-4 select-none">
                    {details.title || details.name}
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed">
                    {details.overview}
                  </p>
                </div>

                {/* TV Series Controls */}
                {type !== "movie" && (
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Season Selector - Mobile optimized */}
                    <div>
                      <label className="font-semibold text-orange-200 mb-2 sm:mb-3 block text-base sm:text-lg">
                        Seasons:
                      </label>
                      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-3 pt-1 sm:pt-2 custom-scroll">
                        {seasons.map((season) => (
                          <button
                            key={season.id}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-500 border flex-shrink-0 text-sm sm:text-base ${
                              selectedSeason === season.season_number
                                ? "liquid-glass-selected text-white shadow-2xl border-orange-400/60 scale-105 sm:scale-100 transform-gpu"
                                : "glass-surface text-white/90 hover:bg-orange-500/20 hover:border-orange-400/40 hover:scale-105 border-white/20"
                            }`}
                            onClick={() =>
                              fetchEpisodes(details.id, season.season_number)
                            }
                          >
                            <span className="relative z-10">{season.name}</span>
                            {selectedSeason === season.season_number && (
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-600/30 rounded-full blur-sm animate-pulse"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Episode Selector - Mobile optimized grid */}
                    <div>
                      <label className="font-semibold text-orange-200 mb-2 sm:mb-3 block text-base sm:text-lg">
                        Episodes:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 max-h-80 sm:max-h-96 overflow-y-auto custom-scroll pr-1 sm:pr-2 pt-1 sm:pt-2">
                        {episodes.map((ep) => (
                          <button
                            key={ep.episode_number}
                            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-500 border relative overflow-hidden ${
                              selectedEpisode === ep.episode_number
                                ? "liquid-glass-selected text-white shadow-2xl border-orange-400/60 scale-100 transform-gpu"
                                : "glass-surface text-white/90 hover:bg-orange-500/20 hover:border-orange-400/40 hover:scale-102 border-white/20"
                            }`}
                            onClick={() => {
                              setSelectedEpisode(ep.episode_number);
                              setShowPlayer(true);
                            }}
                          >
                            <div className="relative z-10">
                              <div className="text-orange-300 font-bold mb-1 text-xs sm:text-sm">
                                EP {ep.episode_number}
                              </div>
                              <div className="line-clamp-2 text-xs">
                                {ep.name}
                              </div>
                            </div>
                            {selectedEpisode === ep.episode_number && (
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-600/30 rounded-xl sm:rounded-2xl blur-sm animate-pulse"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations - Mobile optimized */}
                {recommendations.length > 0 && (
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-orange-100">
                      You might also like
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4">
                      {recommendations.length === 0 ? (
                        <div className="col-span-full text-white/70 text-center py-8">
                          No recommendations found.
                        </div>
                      ) : (
                        recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="glass-card rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer border border-white/20"
                            onClick={() => router.push(`/details/${rec.id}?type=${rec.media_type}`)}
                          >
                            <img
                              src={
                                rec.poster_path
                                  ? `https://image.tmdb.org/t/p/w200${rec.poster_path}`
                                  : "/no-poster.png"
                              }
                              alt={rec.title || rec.name}
                              className="w-full h-24 sm:h-32 object-cover rounded-lg sm:rounded-xl mb-1 sm:mb-2 border border-white/20 shadow-lg"
                            />
                            <div className="text-center text-xs font-semibold line-clamp-2 text-white/90">
                              {rec.title || rec.name}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .liquid-glass {
          background: rgba(15, 23, 42, 0.4);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .liquid-glass-dropdown {
          background: rgba(15, 23, 42, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6),
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
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 20px rgba(251, 146, 60, 0.2);
          font-weight: 600;
        }

        .liquid-glass-selected {
          background: rgba(251, 146, 60, 0.25);
          backdrop-filter: blur(30px) saturate(200%);
          -webkit-backdrop-filter: blur(30px) saturate(200%);
          box-shadow: 0 20px 40px -12px rgba(251, 146, 60, 0.4),
            0 0 0 1px rgba(251, 146, 60, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass-selected::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
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
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-pill {
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-nav-button {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-nav-button:hover {
          background: rgba(251, 146, 60, 0.2);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Custom scrollbar styles */
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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

        /* Mobile specific optimizations */
        @media (max-width: 640px) {
          .liquid-glass {
            border-radius: 16px;
          }

          .glass-nav-button {
            font-size: 12px;
          }

          .custom-scroll::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
        }
      `}</style>
    </>
  );
}
