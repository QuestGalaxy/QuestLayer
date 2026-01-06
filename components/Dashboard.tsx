import React, { useEffect, useState } from 'react';
import { fetchProjects } from '../lib/supabase';
import { Plus, Layout, ArrowRight, Loader2, Calendar, FolderOpen } from 'lucide-react';

interface DashboardProps {
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProject, onCreateProject }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 bg-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">My Widgets</h2>
            <p className="mt-2 text-slate-400 text-sm">Manage your quest campaigns and settings.</p>
          </div>
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={16} /> New Widget
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-[32px] border border-white/5 bg-slate-900/50 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <FolderOpen size={32} className="text-slate-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">No widgets yet</h3>
              <p className="text-slate-500 text-sm mt-1">Create your first quest campaign to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="group relative cursor-pointer rounded-3xl border border-white/10 bg-slate-900/40 p-6 transition-all hover:bg-slate-900 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: p.accent_color }}
                  >
                    <Layout size={20} />
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400 uppercase">
                    {p.theme}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-indigo-400 transition-colors">
                  {p.name}
                </h3>
                
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase text-slate-500 mt-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform">
                    Edit <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
