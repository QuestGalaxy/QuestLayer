import React, { useEffect, useState } from 'react';
import { fetchAllProjects, fetchProjectStats } from '../lib/supabase';
import { Layout, Globe, ArrowRight, Loader2, Search, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import GlobalFooter from './GlobalFooter';

interface ExplorePageProps {
  onBack: () => void;
}

const ExploreCard: React.FC<{ project: any; stats: any; onImageError: (id: string) => void }> = ({ project, stats, onImageError }) => {
  const [ogImage, setOgImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!project.domain) {
        onImageError(project.id);
        return;
    }
    let isMounted = true;

    const fetchOg = async () => {
      try {
        const url = `https://api.microlink.io/?url=${encodeURIComponent(project.domain.startsWith('http') ? project.domain : `https://${project.domain}`)}&palette=true&audio=false&video=false&iframe=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted) {
            if (data.status === 'success' && data.data.image?.url) {
                setOgImage(data.data.image.url);
            } else {
                onImageError(project.id);
            }
        }
      } catch (e) {
        if (isMounted) {
            onImageError(project.id);
        }
      }
    };

    fetchOg();
    return () => { isMounted = false; };
  }, [project.domain, project.id, onImageError]);

  if (!ogImage) return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/40 h-[380px] animate-pulse">
        <div className="h-48 bg-white/5 rounded-t-3xl" />
    </div>
  );

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-slate-900/40 overflow-hidden transition-all duration-500 hover:bg-slate-900 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col h-full hover:-translate-y-1">
      {/* Card Header / Image Area */}
      <div className="relative h-48 w-full bg-slate-950/50 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden">
            {ogImage ? (
            <img 
                src={ogImage} 
                alt={project.name} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
            />
            ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                <Layout size={64} className="text-white" />
            </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        </div>

        {/* Floating Icon Badge */}
        <div 
          className="absolute -bottom-6 left-6 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl z-10 border-4 border-slate-900 transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: project.accent_color }}
        >
          <Zap size={24} fill="currentColor" />
        </div>

        {/* Theme Badge */}
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
            {project.theme}
          </div>
        </div>
      </div>

      <div className="p-6 pt-10 flex-1 flex flex-col">
        <h3 className="text-2xl font-black text-white mb-2 truncate group-hover:text-indigo-400 transition-colors tracking-tight">
          {project.name}
        </h3>
        
        {project.domain && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 truncate">
            <Globe size={12} className="shrink-0 text-indigo-500" />
            <span className="truncate group-hover:text-indigo-300 transition-colors font-medium">
              {project.domain.replace(/^https?:\/\//, '')}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

const ExplorePage: React.FC<ExplorePageProps> = ({ onBack }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [invalidImages, setInvalidImages] = useState<Set<string>>(new Set());

  const handleImageError = (id: string) => {
    setInvalidImages(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllProjects();
        if (data) {
          // Fetch stats for all projects in parallel
          const projectsWithStats = await Promise.all(
            data.map(async (project: any) => {
              try {
                const stats = await fetchProjectStats(project.id);
                return { ...project, stats };
              } catch (e) {
                console.error(`Failed to load stats for ${project.id}`, e);
                return { ...project, stats: { total_visits: 0, connected_wallets: 0 } };
              }
            })
          );
          
          // Sort by total visits (descending)
          const sortedProjects = projectsWithStats.sort((a, b) => {
            const visitsA = a.stats?.total_visits || 0;
            const visitsB = b.stats?.total_visits || 0;
            return visitsB - visitsA;
          });

          // Filter out duplicate domains (keep the first one found, which is the most popular due to sort)
          const seenDomains = new Set();
          const uniqueProjects = sortedProjects.filter(project => {
            if (!project.domain) return false;
            const domain = project.domain.toLowerCase();
            if (seenDomains.has(domain)) {
              return false;
            }
            seenDomains.add(domain);
            return true;
          });

          setProjects(uniqueProjects);
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter projects first (including invalid images)
  const filteredProjects = projects.filter(p => 
    !invalidImages.has(p.id) &&
    p.domain && (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.domain.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Then paginate the filtered results
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-y-auto custom-scroll h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Globe className="text-white" size={20} />
              </div>
              <span className="text-xl font-black italic tracking-tighter text-white uppercase">
                Quest<span className="text-indigo-500">Explorer</span>
              </span>
            </div>
          </div>

          <div className="relative hidden md:block w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search ecosystems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-4 py-10">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Web3 Communities</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Explore the growing ecosystem of projects using QuestLayer to gamify their user experience.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedProjects.map((project) => (
                  <ExploreCard key={project.id} project={project} stats={project.stats} onImageError={handleImageError} />
                ))}
            </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 pb-10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                          currentPage === i + 1
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500">No projects found matching your search.</p>
            </div>
          )}
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default ExplorePage;
