
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

export const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchProjectDetails = async (projectId: string) => {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
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

export const syncProjectToSupabase = async (state: AppState): Promise<{ projectId: string, error?: any }> => {
  try {
    // 1. Get or Create Project
    let { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('name', state.projectName)
      .limit(1);

    let projectId = projects?.[0]?.id;

    if (projectId) {
      // Update existing project
      const { error: updateError } = await supabase
        .from('projects')
        .update({
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
          accent_color: state.accentColor,
          position: state.position,
          theme: state.activeTheme
        })
        .select()
        .single();
      
      if (projError) throw projError;
      projectId = newProject.id;
    }

    // 2. Sync Tasks
    for (const task of state.tasks) {
      // Check if task exists by title AND project_id
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId)
        .eq('title', task.title)
        .limit(1);

      if (existingTasks && existingTasks.length > 0) {
        // Update existing task
        await supabase
          .from('tasks')
          .update({
            description: task.desc,
            link: task.link,
            icon_url: task.icon,
            xp_reward: task.xp
          })
          .eq('id', existingTasks[0].id);
      } else {
        // Insert new task
        await supabase
          .from('tasks')
          .insert({
            project_id: projectId,
            title: task.title,
            description: task.desc,
            link: task.link,
            icon_url: task.icon,
            xp_reward: task.xp
          });
      }
    }

    return { projectId };
  } catch (err) {
    console.error('Sync failed:', err);
    return { projectId: '', error: err };
  }
};
