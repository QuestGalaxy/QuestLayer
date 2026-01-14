
import { createClient } from '@supabase/supabase-js';
import { AppState } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (supabaseUrl.includes('your_supabase_url') || supabaseAnonKey.includes('your_supabase_anon_key')) {
  console.error('CRITICAL: Supabase environment variables are still using placeholders! Please update your .env file.');
  throw new Error('Invalid Supabase configuration: Placeholders detected');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const fetchProjects = async (ownerAddress: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, created_at, name, owner_id, owner_wallet, domain, accent_color, position, theme, last_ping_at')
    .eq('owner_wallet', ownerAddress)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchAllProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, created_at, name, owner_id, owner_wallet, domain, accent_color, position, theme, last_ping_at')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchProjectDetails = async (projectId: string) => {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, created_at, name, owner_id, owner_wallet, domain, accent_color, position, theme, last_ping_at')
    .eq('id', projectId)
    .single();
  
  if (projectError) throw projectError;

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true }); // or order_index if you have it

  if (tasksError) throw tasksError;

  return { project, tasks };
};

export const deleteProject = async (projectId: string) => {
  // Delete the project (cascade delete should handle tasks, users, etc. if configured in DB)
  // If not configured, we might need to delete related rows manually first.
  // Assuming standard CASCADE setup on foreign keys in Supabase Schema.
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) throw error;
};

export const logProjectView = async (projectId: string) => {
  const { error } = await supabase.rpc('log_project_view', { p_id: projectId });
  if (error) console.error('Error logging view:', error);
};

export const fetchProjectStats = async (projectId: string) => {
  const { data, error } = await supabase.rpc('get_project_stats', { p_id: projectId });
  if (error) throw error;
  return data;
};

export const fetchGlobalDashboardStats = async (ownerAddress: string) => {
  const { data, error } = await supabase.rpc('get_global_dashboard_stats', { owner_addr: ownerAddress });
  if (error) throw error;
  return data;
};

export const fetchUserXP = async (walletAddress: string) => {
  // Use the RPC to get aggregated global XP across all projects
  const { data: globalXP, error } = await supabase.rpc('get_global_xp', { wallet_addr: walletAddress });

  if (error) {
      console.error('Error fetching user XP:', error);
      return { xp: 0, level: 1 };
  }
  
  const xp = globalXP || 0;
  // Calculate Level based on standard formula (same as Widget.tsx)
  const xpPerLevel = 3000;
  const level = Math.floor(xp / xpPerLevel) + 1;

  return { xp, level };
};

export const syncProjectToSupabase = async (state: AppState, ownerAddress?: string): Promise<{ projectId: string, error?: any }> => {
  try {
    // 1. Get or Create Project
    let projectId = state.projectId;

    if (!projectId) {
      // Fallback: Try to find by name + owner if no ID is present in state
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('name', state.projectName)
        .eq('owner_wallet', ownerAddress)
        .limit(1);
      projectId = projects?.[0]?.id;
    }

    if (projectId) {
      // Update existing project
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: state.projectName, // Allow renaming
          domain: state.projectDomain, // Save domain
          accent_color: state.accentColor,
          position: state.position,
          theme: state.activeTheme
        })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
    } else {
      // Create new project
      const { data: newProject, error: projError } = await supabase
        .from('projects')
        .insert({
          name: state.projectName,
          domain: state.projectDomain, // Save domain
          accent_color: state.accentColor,
          position: state.position,
          theme: state.activeTheme,
          owner_wallet: ownerAddress // Save owner
        })
        .select()
        .single();
      
      if (projError) throw projError;
      projectId = newProject.id;
    }

    // 2. Sync Tasks (replace full list to handle deletes/renames)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId);
    if (deleteError) throw deleteError;

    if (state.tasks.length > 0) {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(
          state.tasks.map(task => ({
            project_id: projectId,
            title: task.title,
            description: task.desc,
            link: task.link,
            icon_url: task.icon,
            xp_reward: task.xp
          }))
        );
      if (insertError) throw insertError;
    }

    return { projectId };
  } catch (err) {
    console.error('Sync failed:', err);
    return { projectId: '', error: err };
  }
};
