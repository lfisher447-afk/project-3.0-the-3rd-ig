import React, { useState, useEffect } from 'react';
import { Film, Search, Star, Play, Tv, RefreshCw, Shield, Server, ExternalLink, Calendar, Clock, Layers, ChevronDown, Info, Flame, Sparkles } from 'lucide-react';
import { AppSettings } from '../../types';

interface MoviesMainProps {
  settings?: AppSettings;
}

interface MovieItem {
  id: number;
  title?: string;
  name?: string; // For TV shows
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
}

export const MOVIE_SERVERS = [
  { id: 'vidsrc_to', name: 'VidSrc.to Core', flag: '⚡', badge: 'Primary HD', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}` : `https://vidsrc.to/embed/movie/${id}` },
  { id: 'vidsrc_me', name: 'VidSrc.me Mirror', flag: '🛡️', badge: 'Fast Stream', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` : `https://vidsrc.me/embed/movie?tmdb=${id}` },
  { id: 'vidsrc_cc', name: 'VidSrc.cc Direct', flag: '🌐', badge: '4K Ultra', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` : `https://vidsrc.cc/v2/embed/movie/${id}` },
  { id: 'embed_su', name: 'Embed.su VIP', flag: '🇺🇸', badge: 'Zero Ads', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://embed.su/embed/tv/${id}/${s}/${e}` : `https://embed.su/embed/movie/${id}` },
  { id: 'autoembed', name: 'AutoEmbed Global', flag: '🇨🇦', badge: 'Multi-Audio', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://autoembed.co/tv/tmdb/${id}-${s}-${e}` : `https://autoembed.co/movie/tmdb/${id}` },
  { id: 'superembed', name: 'SuperEmbed Stream', flag: '🇩🇪', badge: '1080p Pure', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` },
  { id: '2embed', name: '2Embed Network', flag: '🇫🇷', badge: 'Bypass Node', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` : `https://www.2embed.cc/embed/${id}` },
  { id: 'movieapi', name: 'MovieAPI Club', flag: '🇬🇧', badge: 'Fast CDN', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://movieapi.club/tv/${id}-${s}-${e}` : `https://movieapi.club/movie/${id}` },
  { id: 'vidsrc_vip', name: 'VidSrc.vip Node', flag: '🇯🇵', badge: 'Asia CDN', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://vidsrc.vip/embed/tv/${id}/${s}/${e}` : `https://vidsrc.vip/embed/movie/${id}` },
  { id: 'smashystream', name: 'SmashyStream Mesh', flag: '🇦🇺', badge: 'Undetectable', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}` : `https://embed.smashystream.com/playere.php?tmdb=${id}` },
  { id: 'player_autoembed', name: 'Player AutoEmbed', flag: '🇸🇬', badge: 'Stable', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` : `https://player.autoembed.cc/embed/movie/${id}` },
  { id: 'cinemanectar', name: 'CinemaNectar Pro', flag: '🇺🇦', badge: 'Cinema HD', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://cinemanectar.com/embed/tv/${id}/${s}/${e}` : `https://cinemanectar.com/embed/movie/${id}` },
  { id: 'vidlink', name: 'VidLink Pro', flag: '🇳🇱', badge: 'Direct Mesh', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://vidlink.pro/tv/${id}/${s}/${e}` : `https://vidlink.pro/movie/${id}` },
  { id: 'superstream', name: 'SuperStream Top', flag: '🌐', badge: 'Global Mirror', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://superstream.top/embed/tv/${id}/${s}/${e}` : `https://superstream.top/embed/movie/${id}` },
  { id: 'vidbinge', name: 'VidBinge Stealth', flag: '🛡️', badge: 'Protected', urlPattern: (id: number, type: string, s = 1, e = 1) => type === 'tv' ? `https://vidbinge.dev/embed/tv/${id}/${s}/${e}` : `https://vidbinge.dev/embed/movie/${id}` },
];

const GENRES = [
  { id: 0, name: '🔥 All Trending' },
  { id: 28, name: 'Action' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 16, name: 'Animation' },
  { id: 53, name: 'Thriller' },
  { id: 14, name: 'Fantasy' },
  { id: 80, name: 'Crime' },
];

export const MoviesMain: React.FC<MoviesMainProps> = ({ settings }) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MovieItem | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>('vidsrc_to');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isTheater, setIsTheater] = useState(false);
  const [useNativeStreamLoader, setUseNativeStreamLoader] = useState(false);

  // TMDB Key fallback
  const tmdbKey = settings?.movies?.tmdbApiKey || '15d2166f754b7132e022f6e520a32049';

  useEffect(() => {
    fetchMoviesData();
  }, [activeCategory]);

  const fetchMoviesData = async () => {
    setIsSearching(true);
    try {
      let endpoint = `https://api.themoviedb.org/3/trending/all/day?api_key=${tmdbKey}`;
      if (activeCategory > 0) {
        endpoint = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbKey}&with_genres=${activeCategory}&sort_by=popularity.desc`;
      }
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.results || []);
      }
    } catch (e) {
      console.error('TMDB fetch error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMovies(data.results || []);
      }
    } catch (e) {
      console.error('TMDB search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectItem = async (item: MovieItem) => {
    setSelectedItem(item);
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setTrailerUrl(null);

    // Fetch official trailer from TMDB
    const type = item.media_type === 'tv' || item.name ? 'tv' : 'movie';
    try {
      const trailerRes = await fetch(
        `https://api.themoviedb.org/3/${type}/${item.id}/videos?api_key=${tmdbKey}`
      );
      if (trailerRes.ok) {
        const trailerData = await trailerRes.json();
        const youtubeTrailer = (trailerData.results || []).find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (youtubeTrailer) {
          setTrailerUrl(`https://www.youtube-nocookie.com/embed/${youtubeTrailer.key}?autoplay=1`);
        }
      }
    } catch {}
  };

  const currentServerObj = MOVIE_SERVERS.find((s) => s.id === selectedServer) || MOVIE_SERVERS[0];
  const isTv = selectedItem?.media_type === 'tv' || !!selectedItem?.name;
  const activeStreamUrl = selectedItem
    ? currentServerObj.urlPattern(selectedItem.id, isTv ? 'tv' : 'movie', selectedSeason, selectedEpisode)
    : '';

  return (
    <div className="space-y-8 select-none pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#163842] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <Film size={18} />
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold">
              TMDB Cinema & Multi-Server Hub
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
            Movies, Series & HD Cinema Deck
          </h1>
          <p className="text-xs text-[#789d9a] mt-1 max-w-2xl">
            Stream full-length movies, trending TV series, and 4K trailers powered by TMDB metadata and 15+ protected, ad-free streaming servers.
          </p>
        </div>

        {/* Server Count Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#091b20] border border-[#163942] rounded-2xl text-xs font-mono text-[#48e4ff] shrink-0">
          <Shield size={15} className="text-rose-400" />
          <span>{MOVIE_SERVERS.length} Undetectable Servers Online</span>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="p-5 rounded-2xl bg-[#091b20] border border-[#1a3f4a] shadow-lg flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any movie, TV series, franchise, or actor (e.g., Oppenheimer, Stranger Things, Dune)..."
            className="w-full bg-[#061215] border border-[#183a44] rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 disabled:opacity-50 shadow-md shadow-rose-950/40"
        >
          {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <Film size={14} />}
          <span>Search Cinema</span>
        </button>
      </form>

      {/* Genre Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setActiveCategory(g.id);
              setQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeCategory === g.id
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-[#091b20] hover:bg-[#122f37] text-zinc-300 border border-[#183d47]'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* ACTIVE MOVIE STREAMING STAGE */}
      {selectedItem && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film size={18} className="text-rose-400" />
              <span>Playing: {selectedItem.title || selectedItem.name}</span>
            </h2>
            <button
              onClick={() => setSelectedItem(null)}
              className="px-3 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl transition"
            >
              ✕ Close Cinema Stage
            </button>
          </div>

          {/* Server Selector & Loader Mode Ribbon */}
          <div className="p-4 rounded-3xl bg-[#081b20] border border-[#163c46] shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#13353e] pb-3">
              <div className="flex items-center gap-2">
                <Server size={15} className="text-rose-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Active Cinema Engine:
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#113139] border border-[#1c4955] text-[#48e4ff] font-mono font-bold">
                  {useNativeStreamLoader ? '⚡ Server-Side Native Stream Proxy' : `${currentServerObj.flag} ${currentServerObj.name}`}
                </span>
              </div>

              {/* Loader Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#051316] p-1 rounded-2xl border border-[#183a43]">
                <button
                  onClick={() => setUseNativeStreamLoader(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    !useNativeStreamLoader
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Shield size={13} />
                  <span>Embed Server (15 Mirror Nodes)</span>
                </button>
                <button
                  onClick={() => setUseNativeStreamLoader(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    useNativeStreamLoader
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Native Direct Stream Loader</span>
                </button>
              </div>

              {isTv && (
                <div className="flex items-center gap-2 bg-[#051316] p-1 rounded-xl border border-[#183a43]">
                  <span className="text-xs font-mono text-zinc-400 pl-2">S:</span>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-[#081f25] text-white text-xs font-mono font-bold rounded-lg px-2 py-1 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                      <option key={s} value={s}>
                        Season {s}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-mono text-zinc-400">E:</span>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                    className="bg-[#081f25] text-white text-xs font-mono font-bold rounded-lg px-2 py-1 outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((ep) => (
                      <option key={ep} value={ep}>
                        Episode {ep}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Server Grid Selector (When in Embed mode) */}
            {!useNativeStreamLoader && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {MOVIE_SERVERS.map((srv) => {
                  const isActive = selectedServer === srv.id;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => setSelectedServer(srv.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                          : 'bg-[#061518] hover:bg-[#0d2930] border border-[#13343c] text-zinc-300'
                      }`}
                    >
                      <span>{srv.flag}</span>
                      <span>{srv.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Protected Cinema Player Frame */}
          <div className="relative w-full aspect-video bg-black rounded-3xl border border-[#163a43] overflow-hidden shadow-2xl">
            {useNativeStreamLoader ? (
              <div className="w-full h-full relative flex items-center justify-center bg-zinc-950">
                <video
                  key={`${selectedItem.id}-${selectedSeason}-${selectedEpisode}`}
                  src={`/api/video/stream?id=tmdb_${selectedItem.id}&res=1080p`}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.warn('Native stream error fallback:', e);
                  }}
                />
              </div>
            ) : (
              <iframe
                src={activeStreamUrl}
                title={selectedItem.title || selectedItem.name}
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>

          {/* Movie Overview Details */}
          <div className="p-6 rounded-3xl bg-[#07171a] border border-[#15343c] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#13353e] pb-3">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{selectedItem.title || selectedItem.name}</h3>
                <div className="flex items-center gap-3 text-xs font-mono text-[#789d9a]">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star size={14} className="fill-current" />
                    <span>{selectedItem.vote_average?.toFixed(1)} / 10</span>
                  </span>
                  <span>•</span>
                  <span>{selectedItem.release_date || selectedItem.first_air_date || '2024'}</span>
                  <span>•</span>
                  <span className="uppercase text-rose-400 font-bold">{isTv ? 'TV Series' : 'Feature Film'}</span>
                </div>
              </div>

              {trailerUrl && (
                <button
                  onClick={() => window.open(trailerUrl, '_blank')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Play size={14} className="fill-current" />
                  <span>Watch HD Trailer</span>
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{selectedItem.overview}</p>
          </div>
        </div>
      )}

      {/* Movies & TV Shows Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame size={18} className="text-rose-400" />
            <span>Trending Cinema & Box Office Highlights</span>
          </h2>
          <span className="text-xs font-mono text-[#789d9a]">{movies.length} Title Results</span>
        </div>

        {isSearching ? (
          <div className="p-12 text-center text-rose-400 bg-[#07171a] border border-[#15343c] rounded-3xl space-y-3">
            <RefreshCw size={32} className="animate-spin mx-auto text-rose-400" />
            <div className="text-xs font-mono font-bold tracking-wider">Querying TMDB Global Cinema Database...</div>
          </div>
        ) : movies.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono bg-[#07171a] border border-[#15343c] rounded-3xl">
            No movies or series found matching search query.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {movies.map((item) => {
              if (!item.poster_path && !item.backdrop_path) return null;
              const title = item.title || item.name || 'Untitled';
              const posterUrl = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : `https://image.tmdb.org/t/p/w500${item.backdrop_path}`;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="p-3 rounded-3xl bg-[#07171a] border border-[#15343c] hover:border-rose-500 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between shadow-xl relative overflow-hidden"
                >
                  <div>
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-zinc-900">
                      <img
                        src={posterUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
                          <Play size={22} className="fill-current ml-0.5" />
                        </div>
                      </div>

                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                        <Star size={11} className="fill-current" />
                        {item.vote_average?.toFixed(1) || '7.5'}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-white line-clamp-2 group-hover:text-rose-400 transition-colors leading-snug">
                      {title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#122c33] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{item.release_date || item.first_air_date || '2024'}</span>
                    <span className="text-rose-400 font-bold group-hover:translate-x-1 transition-transform">
                      Stream →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
