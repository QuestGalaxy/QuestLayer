
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

const getFaviconUrl = (link: string) => {
  try {
    if (!link || link.length < 4) return '';
    let validLink = link.trim();
    validLink = validLink.replace(/[\/.]+$/, '');
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
      validLink = `https://${validLink}`;
    }
    const url = new URL(validLink);
    let hostname = url.hostname;
    if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
    const parts = hostname.split('.');
    if (parts.length < 2 || parts[parts.length - 1].length < 2) return '';
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
  } catch {
    return '';
  }
};

const fetchOgImage = async (domain?: string | null) => {
  if (!domain) return null;
  try {
    const target = domain.startsWith('http') ? domain : `https://${domain}`;
    const res = await fetch(`/api/og?url=${encodeURIComponent(target)}`);
    const data = await res.json();
    return data?.image ?? null;
  } catch {
    return null;
  }
};

const fetchLogoImage = async (domain?: string | null) => {
  if (!domain) return null;
  try {
    const target = domain.startsWith('http') ? domain : `https://${domain}`;
    const res = await fetch(`/api/logo?url=${encodeURIComponent(target)}`);
    const data = await res.json();
    return data?.logo ?? null;
  } catch {
    return null;
  }
};

export const fetchProjects = async (ownerAddress: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, created_at, name, owner_id, owner_wallet, domain, description, social_links, accent_color, position, theme, last_ping_at, logo_url, banner_url')
    .eq('owner_wallet', ownerAddress)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchAllProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, created_at, name, owner_id, owner_wallet, domain, description, social_links, accent_color, position, theme, last_ping_at, logo_url, banner_url')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const normalizeDomain = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  try {
    const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withScheme).hostname.replace(/^www\./, '');
  } catch {
    return trimmed.split('/')[0].replace(/^www\./, '');
  }
};

export const fetchProjectIdByDomain = async (domain: string) => {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('domain', normalized)
    .limit(1)
    .single();

  if (error) return null;
  return data?.id ?? null;
};

export const fetchProjectDetails = async (projectId: string) => {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, created_at, name, owner_id, owner_wallet, domain, description, social_links, accent_color, position, theme, last_ping_at, logo_url, banner_url')
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

    // Treat temporary IDs as new projects
    if (projectId && projectId.startsWith('temp-')) {
      projectId = undefined;
    }

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

    const logoUrl = state.projectLogo
      || (state.projectDomain ? await fetchLogoImage(state.projectDomain) : null)
      || (state.projectDomain ? getFaviconUrl(state.projectDomain) : '');
    const bannerUrl = state.projectBanner || (state.projectDomain ? await fetchOgImage(state.projectDomain) : null);

    if (projectId) {
      const updatePayload: Record<string, any> = {
        name: state.projectName,
        domain: state.projectDomain,
        description: state.projectDescription ?? null,
        social_links: state.projectSocials ?? null,
        accent_color: state.accentColor,
        position: state.position,
        theme: state.activeTheme,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null
      };

      // Update existing project
      const { error: updateError } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', projectId);

      if (updateError) throw updateError;
    } else {
      // Create new project
      const { data: newProject, error: projError } = await supabase
        .from('projects')
        .insert({
          name: state.projectName,
          domain: state.projectDomain, // Save domain
          description: state.projectDescription ?? null,
          social_links: state.projectSocials ?? null,
          accent_color: state.accentColor,
          position: state.position,
          theme: state.activeTheme,
          owner_wallet: ownerAddress, // Save owner
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null
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
            xp_reward: task.xp,
            is_sponsored: task.isSponsored,
            task_section: task.section ?? 'missions',
            task_kind: task.kind ?? 'link',
            reward_cadence: task.rewardCadence ?? 'once',
            quiz_type: task.quizType ?? 'secret_code',
            choices: task.choices ?? null,
            correct_choice: typeof task.correctChoice === 'number' ? task.correctChoice : null,
            question: task.question ?? '',
            answer: task.answer ?? '',
            nft_contract: task.nftContract ?? null,
            nft_chain_id: task.nftChainId ?? null,
            token_contract: task.tokenContract ?? null,
            token_chain_id: task.tokenChainId ?? null,
            min_token_amount: task.minTokenAmount ?? null
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
