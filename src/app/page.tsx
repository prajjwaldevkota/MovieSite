"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Play,
  Calendar,
  Star,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import Head from "next/head";

// Type definitions for better performance
interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  overview?: string;
}

interface ApiResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showingTrending, setShowingTrending] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("trending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Reset to page 1 when changing sections
    setCurrentPage(1);
  }, [activeSection]);

  useEffect(() => {
    // Fetch data based on active section and current page
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        let data;
        if (activeSection === "trending") {
          const res = await fetch("/api/tmdb/trending/all/day", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queryParams: { language: "en-US", page: currentPage } }),
          });
          data = await res.json();
        } else if (activeSection === "topRatedTV") {
          const res = await fetch("/api/tmdb/tv/top_rated", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queryParams: { language: "en-US", page: currentPage } }),
          });
          data = await res.json();
          if (data && data.results) {
            data.results = data.results.map((item: Movie) => ({ ...item, media_type: "tv" }));
          }
        } else if (activeSection === "topRatedMovies") {
          const res = await fetch("/api/tmdb/movie/top_rated", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queryParams: { language: "en-US", page: currentPage } }),
          });
          data = await res.json();
          if (data && data.results) {
            data.results = data.results.map((item: Movie) => ({ ...item, media_type: "movie" }));
          }
        }
        if (data) {
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total_results || 0);
        }
        setShowingTrending(activeSection === "trending");
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
        setMovies([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeSection, currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = async (e: React.FormEvent, page = 1) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError("");
    setCurrentPage(page);
    try {
      const res = await fetch("/api/tmdb/search/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryParams: { query: search, language: "en-US", page } }),
      });
      const data = await res.json();
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);
      setShowingTrending(false);
      setActiveSection("search");
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
      setMovies([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    // If we're in search mode, perform search with new page
    if (activeSection === "search" && search.trim()) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(fakeEvent, newPage);
    }
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPaginationPages = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleCardClick = useCallback(
    (movie: Movie) => {
      const type = movie.media_type === "tv" ? "tv" : "movie";
      router.push(`/details/${movie.id}?type=${type}`);
    },
    [router]
  );

  // Memoized filtered movies for better performance
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      if (selectedFilter === "all") return true;
      return movie.media_type === selectedFilter;
    });
  }, [movies, selectedFilter]);

  // Memoized pagination pages
  const paginationPages = useMemo(
    () => getPaginationPages(),
    [currentPage, totalPages]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchTerm: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchTerm.trim()) {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSearch(fakeEvent, 1);
          }
        }, 500);
      };
    })(),
    []
  );

  return (
    <>
      <Head>
        <title>CineStream - Discover Movies & Series</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
        {/* Liquid Glass Animated Background */}
        <div className="fixed inset-0 z-0">
          {/* Base gradient with liquid flow */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90"></div>

          {/* Flowing liquid blobs */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-20 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

          {/* Flowing liquid waves */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-purple-500/10 to-transparent transform -skew-y-12 animate-pulse delay-500"></div>
            <div className="absolute top-1/4 left-0 w-full h-full bg-gradient-to-r from-transparent via-violet-500/10 to-transparent transform skew-y-12 animate-pulse delay-1500"></div>
          </div>

          {/* Glass texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-3xl"></div>
        </div>

        {/* Liquid Glass Header */}
        <header className="z-10 sticky top-0 backdrop-blur-3xl border-b border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-3xl"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent drop-shadow-2xl mb-2 animate-pulse select-none">
                CineStream
              </div>
              <p className="text-white/70 text-sm sm:text-base font-medium">
                Discover your next favorite movie or series
              </p>
            </div>

            {/* Liquid Glass Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                {/* Glowing liquid border */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-violet-500/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-700 animate-pulse"></div>

                {/* Glass container */}
                <div className="relative bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 rounded-3xl"></div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 z-10">
                      <Search className="w-5 h-5 text-white/80" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search movies, series, actors..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        debouncedSearch(e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch(e);
                        }
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-transparent focus:outline-none text-white placeholder:text-white/60 transition-all duration-300 text-lg font-medium focus:placeholder:text-white/40"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="absolute right-2 px-3 sm:px-6 py-2 bg-gradient-to-r from-purple-500/80 via-indigo-500/80 to-violet-500/80 backdrop-blur-xl hover:from-purple-400 hover:via-indigo-400 hover:to-violet-400 rounded-2xl font-semibold transition-all duration-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 border border-white/20"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Search</span>
                          <Search className="sm:hidden w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="max-w-2xl mx-auto mt-4 p-4 bg-red-500/20 backdrop-blur-3xl border border-red-500/30 rounded-2xl text-red-200 text-center">
                {error}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section Header with Liquid Glass */}
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 transition-all duration-300 ${navHidden ? 'translate-y-[-100px] opacity-0' : 'translate-y-0 opacity-100'}`} ref={navRef}>
            {/* Section Navigation */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-3xl rounded-2xl p-1 pl-3 sm:pl-6 sm:p-2 border border-white/20 shadow-2xl mx-auto justify-center">
              {[
                { key: "trending", label: "Trending", icon: TrendingUp },
                { key: "topRatedMovies", label: "Top Movies", icon: Play },
                { key: "topRatedTV", label: "Top Series", icon: Calendar },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl font-medium transition-all duration-500 text-xs sm:text-sm ${
                    activeSection === key
                      ? "bg-gradient-to-r from-purple-500/80 to-violet-500/80 text-white shadow-lg backdrop-blur-xl border border-white/20"
                      : "text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-xl"
                  }`}
                  style={{ minWidth: 0 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Current Section Title with Results Count */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-3xl rounded-2xl px-6 py-3 border border-white/20">
              {activeSection === "trending" && (
                <TrendingUp className="w-6 h-6 text-purple-400" />
              )}
              {activeSection === "topRatedMovies" && (
                <Play className="w-6 h-6 text-purple-400" />
              )}
              {activeSection === "topRatedTV" && (
                <Calendar className="w-6 h-6 text-violet-400" />
              )}
              {activeSection === "search" && (
                <Search className="w-6 h-6 text-violet-400" />
              )}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {activeSection === "trending" && "Trending Now"}
                  {activeSection === "topRatedMovies" && "Top Rated Movies"}
                  {activeSection === "topRatedTV" && "Top Rated Series"}
                  {activeSection === "search" && "Search Results"}
                </h2>
                {totalResults > 0 && (
                  <p className="text-sm text-white/60">
                    {totalResults.toLocaleString()} results • Page {currentPage}{" "}
                    of {totalPages}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Filter - Only show for search results */}
          {activeSection === "search" && (
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-3xl rounded-2xl p-1 sm:p-2 border border-white/20 shadow-2xl">
                {[
                  { key: "all", label: "All", icon: Filter },
                  { key: "movie", label: "Movies", icon: Play },
                  { key: "tv", label: "Series", icon: Calendar },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFilter(key)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl font-medium transition-all duration-500 text-xs sm:text-sm ${
                      selectedFilter === key
                        ? "bg-gradient-to-r from-purple-500/80 to-violet-500/80 text-white shadow-lg backdrop-blur-xl border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-xl"
                    }`}
                    style={{ minWidth: 0 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xs:inline sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Liquid Glass Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {loading ? (
              Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="group animate-pulse">
                  <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl">
                    <div className="aspect-[2/3] bg-gradient-to-br from-white/20 via-white/10 to-white/20 animate-pulse"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-white/20 rounded-xl animate-pulse"></div>
                      <div className="h-3 bg-white/20 rounded-xl w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (activeSection === "search" ? filteredMovies : movies).length ===
              0 ? (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl animate-fade-in">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/20 animate-bounce">
                    <Search className="w-12 h-12 text-white/60" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/80 mb-2">
                    {loading ? "Loading..." : "No results found"}
                  </h3>
                  <p className="text-white/60">
                    {loading
                      ? "Fetching content..."
                      : "Try searching for something else or switch sections"}
                  </p>
                </div>
              </div>
            ) : (
              (activeSection === "search" ? filteredMovies : movies).map(
                (movie, idx) => (
                  <div
                    key={`${movie.id}-${idx}`}
                    className="group cursor-pointer h-full animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => handleCardClick(movie)}
                  >
                    <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-3xl border border-white/20 hover:border-white/40 transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 h-full flex flex-col group-hover:bg-white/15">
                      {/* Liquid glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>

                      {/* Poster */}
                      <div className="aspect-[2/3] overflow-hidden bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-violet-900/20 flex-shrink-0 relative rounded-t-3xl">
                        {movie.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title || movie.name || "Movie poster"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            width={500}
                            height={750}
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-white/30" />
                          </div>
                        )}

                        {/* Liquid overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                            <div className="flex items-center gap-2 mb-2 bg-white/20 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-white">
                                {movie.vote_average?.toFixed(1) || "N/A"}
                              </span>
                            </div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                              <Play className="w-6 h-6 text-white ml-1" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content with liquid glass effect */}
                      <div className="p-4 flex-1 flex flex-col justify-between bg-white/5 backdrop-blur-xl rounded-b-3xl border-t border-white/10">
                        <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors duration-500 text-sm sm:text-base mb-2 line-clamp-2 min-h-[2.5rem]">
                          {movie.title || movie.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-white/70 mt-auto">
                          <span className="bg-white/10 backdrop-blur-xl px-2 py-1 rounded-full border border-white/20">
                            {movie.release_date
                              ? movie.release_date.slice(0, 4)
                              : movie.first_air_date
                              ? movie.first_air_date.slice(0, 4)
                              : "N/A"}
                          </span>
                          <span className="capitalize bg-gradient-to-r from-purple-500/20 to-violet-500/20 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20">
                            {movie.media_type === "tv" ? "Series" : "Movie"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          {/* Liquid Glass Pagination */}
          {totalPages > 1 && !loading && (
            <div className="mt-12 flex flex-col items-center gap-4">
              {/* Pagination Controls */}
              <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-3xl rounded-2xl p-1 sm:p-2 border border-white/20 shadow-2xl">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1 sm:p-2 rounded-xl transition-all duration-300 text-xs sm:text-base ${
                    currentPage === 1
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white hover:bg-white/10 hover:text-purple-400 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {paginationPages.map((page, idx) => (
                    <React.Fragment key={idx}>
                      {page === "ellipsis" ? (
                        <div className="px-3 py-2 text-white/50">
                          <MoreHorizontal className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page as number)}
                          className={`px-2 sm:px-3 py-1 sm:py-2 rounded-xl font-medium transition-all duration-300 text-xs sm:text-base ${
                            currentPage === page
                              ? "bg-gradient-to-r from-purple-500/80 to-violet-500/80 text-white shadow-lg backdrop-blur-xl border border-white/20"
                              : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-1 sm:p-2 rounded-xl transition-all duration-300 text-xs sm:text-base ${
                    currentPage === totalPages
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white hover:bg-white/10 hover:text-purple-400 active:scale-95"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Page Info */}
              <div className="bg-white/10 backdrop-blur-3xl rounded-2xl px-6 py-3 border border-white/20">
                <p className="text-white/70 text-sm text-center">
                  Showing page{" "}
                  <span className="text-purple-400 font-semibold">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="text-violet-400 font-semibold">
                    {totalPages}
                  </span>
                  {totalResults > 0 && (
                    <span className="ml-2">
                      ({totalResults.toLocaleString()} total results)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Liquid Glass Footer */}
        <footer className="relative z-10 -mt-6 py-8 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 p-6 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-violet-500/5 rounded-3xl"></div>
              <p className="relative text-white/70 text-sm">
                &copy; {new Date().getFullYear()} CineStream. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Custom CSS Animations */}
        <style jsx global>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            opacity: 0;
          }

          /* Improved scrollbar styling */
          .custom-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }

          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            transition: background 0.3s ease;
          }

          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }

          /* Enhanced glass morphism effects */
          .glass-nav-button {
            background: rgba(15, 23, 42, 0.3);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
          }

          /* Improved hover effects */
          .group:hover .group-hover\\:scale-110 {
            transform: scale(1.1);
          }

          /* Loading shimmer effect */
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }

          .shimmer {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.1) 25%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0.1) 75%
            );
            background-size: 200px 100%;
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    </>
  );
}
