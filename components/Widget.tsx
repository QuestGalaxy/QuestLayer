
import React, { useState, useEffect, useRef } from 'react';
import { Task, Position, ThemeType, AppState } from '../types.ts';
import { THEMES } from '../constants.ts';
import { 
  LogOut, X, Zap, Trophy, Flame, ChevronRight, CheckCircle2, 
  ShieldCheck, ExternalLink, Sparkles, Loader2, Send, Coins, Gem, Sword, Crown, 
  MessageSquare, Facebook, Linkedin, Twitter
} from 'lucide-react';
import { supabase, logProjectView } from '../lib/supabase';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';

interface WidgetProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isPreview?: boolean;
}

const Widget: React.FC<WidgetProps> = ({ isOpen, setIsOpen, state, setState, isPreview = false }) => {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const isConnecting = status === 'connecting' || status === 'reconnecting';
  const [loadingId, setLoadingId] = useState<string | number | null>(null);
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>([]);
  const [verifyingPlatforms, setVerifyingPlatforms] = useState<string[]>([]);
  const [timerValue, setTimerValue] = useState(10);
  const [visualXP, setVisualXP] = useState(state.userXP);
  const [globalXP, setGlobalXP] = useState(0);
  const [dbProjectId, setDbProjectId] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [taskMap, setTaskMap] = useState<Record<string | number, string>>({}); // localId -> dbUuid
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string | number>>(new Set());

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shareVerifyTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const isDisconnectingRef = useRef(false);
  const initialStateRef = useRef(state);
  const cacheScope = globalThis.location?.origin ?? 'unknown-origin';
  const walletKey = address ? `questlayer:wallet:${address.toLowerCase()}:${cacheScope}` : '';

  const activeTheme = THEMES[state.activeTheme];
  const isLightTheme = ['minimal', 'brutal', 'aura'].includes(state.activeTheme);
  const isTransparentTheme = state.activeTheme === 'glass';

  const positionClasses = isPreview ? 'absolute' : 'fixed';

  // --- SUPABASE SYNC ---
  useEffect(() => {
    const initSupabase = async () => {
      if (!isConnected || !address) return;

      try {
        let projectId = state.projectId;

        // Fallback: Try to find project by name if ID is missing (legacy/unsynced state)
        if (!projectId && state.projectName) {
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('name', state.projectName)
            .limit(1);
          projectId = projects?.[0]?.id;
        }

        if (!projectId) {
          // If project doesn't exist in DB (Unpublished Preview Mode), 
          // we do NOT create the user or sync DB progress.
          // We just operate in local mode.
          console.log('Preview Mode: Project not published. Running in local-only mode.');
          return;
        }

        setDbProjectId(projectId);

        // 7. Log View Analytics (Once per session/mount)
        if (!isPreview) {
          logProjectView(projectId);
        }

        // 2. Fetch Tasks Mappings (Read-Only)
        // We only map tasks that exist in the DB. New unsaved tasks won't have IDs.
        const taskMapping: Record<string | number, string> = {};
        if (state.tasks.length > 0) {
           const { data: dbTasks } = await supabase
             .from('tasks')
             .select('id, title')
             .eq('project_id', projectId);
            
           if (dbTasks) {
             // Map by title (assuming titles are unique per project for simplicity)
             // or ideally we would have a stable ID.
             state.tasks.forEach(localTask => {
               const match = dbTasks.find(d => d.title === localTask.title);
               if (match) {
                 taskMapping[localTask.id] = match.id;
               }
             });
           }
        }
        setTaskMap(taskMapping);

        // 3. Get or Create User
        // Use upsert to handle race conditions safely
        const { data: user, error: userError } = await supabase
          .from('end_users')
          .upsert(
            { 
              project_id: projectId, 
              wallet_address: address 
            }, 
            { onConflict: 'project_id,wallet_address' }
          )
          .select('id')
          .single();

        if (userError) throw userError;
        let userId = user.id;
        setDbUserId(userId);

        // 4. Fetch Progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (progress) {
          // Check if claimed today (UTC Comparison)
          let isClaimedToday = false;
          if (progress.last_claim_date) {
            const lastClaim = new Date(progress.last_claim_date);
            const now = new Date();
            isClaimedToday = lastClaim.getUTCFullYear() === now.getUTCFullYear() &&
                             lastClaim.getUTCMonth() === now.getUTCMonth() &&
                             lastClaim.getUTCDate() === now.getUTCDate();
          }

          // Sync DB state to Local State
          setState(prev => ({
            ...prev,
            userXP: progress.xp || 0,
            currentStreak: progress.streak || 1,
            dailyClaimed: isClaimedToday
          }));
        } else {
          // Initialize progress row
          await supabase.from('user_progress').insert({
            user_id: userId,
            xp: 0,
            streak: 1
          });
        }

        // 5. Fetch completed tasks
        const { data: completions } = await supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', userId);

        if (completions) {
          const dbCompletedIds = new Set(completions.map(c => c.task_id));
          const localCompletedIds = new Set<string | number>();

          state.tasks.forEach(t => {
            const dbUuid = taskMapping[t.id];
            // If task is in DB and completed, mark it.
            if (dbUuid && dbCompletedIds.has(dbUuid)) {
              localCompletedIds.add(t.id);
            }
          });
          
          setCompletedTaskIds(localCompletedIds);
        }

        // 6. Fetch Viral Boosts
        const { data: viralBoosts } = await supabase
          .from('viral_boost_completions')
          .select('platform')
          .eq('user_id', userId)
          .eq('project_id', projectId);
        
        if (viralBoosts) {
          setSharedPlatforms(viralBoosts.map(v => v.platform));
        }

        // 7. Fetch Global XP
        const { data: globalXPData } = await supabase.rpc('get_global_xp', { wallet_addr: address });
        if (globalXPData !== null) {
          setGlobalXP(globalXPData);
        }

      } catch (err: any) {
        console.error('Supabase sync error details:', {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint
        });
        // Visual feedback for debugging
        if (isPreview) {
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold z-[100]';
          toast.innerText = `DB Sync Failed: ${err.message || 'Unknown error'}`;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 5000);
        }
      }
    };

    initSupabase();
  }, [isConnected, address, state.projectName, state.projectId]); // Added state.projectId dependency

  // --- XP ANIMATION ENGINE ---
  useEffect(() => {
    if (visualXP !== state.userXP) {
      const startTime = performance.now();
      const startXP = visualXP;
      const targetXP = state.userXP;
      const duration = 1200;

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuad = (t: number) => t * (2 - t);
        const currentXP = Math.floor(startXP + (targetXP - startXP) * easeOutQuad(progress));
        setVisualXP(currentXP);
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [state.userXP]);

  useEffect(() => {
    if (!wasConnectedRef.current && isConnected) {
      playSound('connect');
    }
    wasConnectedRef.current = isConnected;
    if (!isConnected) {
      isDisconnectingRef.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || !walletKey) return;
    try {
      const cached = localStorage.getItem(walletKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Pick<AppState, 'tasks' | 'userXP' | 'currentStreak' | 'dailyClaimed'> & {
          sharedPlatforms?: string[];
        };
        setState(prev => ({
          ...prev,
          tasks: parsed.tasks ?? prev.tasks,
          userXP: parsed.userXP ?? prev.userXP,
          currentStreak: parsed.currentStreak ?? prev.currentStreak,
          dailyClaimed: parsed.dailyClaimed ?? prev.dailyClaimed
        }));
        // We do NOT load sharedPlatforms from cache if connected, as DB is source of truth.
        // But if unconnected (preview mode), we can respect it or just default to empty.
        if (!dbUserId) {
             setSharedPlatforms(parsed.sharedPlatforms ?? []);
        }
      } else {
        const fresh = initialStateRef.current;
        setState(prev => ({
          ...prev,
          tasks: fresh.tasks,
          userXP: fresh.userXP,
          currentStreak: fresh.currentStreak,
          dailyClaimed: fresh.dailyClaimed
        }));
        setSharedPlatforms([]);
      }
    } catch {
      // Ignore cache errors and keep current state.
    }
  }, [isConnected, walletKey, setState, dbUserId]);

  useEffect(() => {
    if (!isConnected || !walletKey) return;
    if (isDisconnectingRef.current) return;
    try {
      const payload = {
        tasks: state.tasks,
        userXP: state.userXP,
        currentStreak: state.currentStreak,
        dailyClaimed: state.dailyClaimed,
        sharedPlatforms
      };
      localStorage.setItem(walletKey, JSON.stringify(payload));
    } catch {
      // Ignore storage errors in case localStorage is unavailable.
    }
  }, [isConnected, walletKey, state.tasks, state.userXP, state.currentStreak, state.dailyClaimed, sharedPlatforms]);

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: 'connect' | 'reward' | 'fanfare') => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.08; 
    const now = ctx.currentTime;
    if (type === 'connect') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.connect(masterGain);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'reward') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.04);
        g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.25);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'fanfare') {
      [392.00, 523.25, 659.25, 783.99].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.connect(g);
        g.connect(masterGain);
        g.gain.setValueAtTime(0, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.1);
        g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.6);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.6);
      });
    }
  };

  const calculateLevel = (xp: number) => {
    // Use Global XP if available (connected), otherwise local XP (preview/unconnected)
    const effectiveXP = isConnected ? (globalXP > xp ? globalXP : xp) : xp;
    
    const xpPerLevel = 3000;
    const lvl = Math.floor(effectiveXP / xpPerLevel) + 1;
    const progress = ((effectiveXP % xpPerLevel) / xpPerLevel) * 100;
    const nextLevelXP = lvl * xpPerLevel;
    const xpNeeded = nextLevelXP - effectiveXP;
    
    return { lvl, progress: Math.floor(progress), xpNeeded, effectiveXP };
  };

  const getRankName = () => {
    const { lvl } = calculateLevel(visualXP); // VisualXP is local. We should use global for rank too.
    if (lvl < 2) return "Pioneer";
    if (lvl < 5) return "Guardian";
    return "Overlord";
  };

  const claimDaily = async () => {
    if (state.dailyClaimed) return;
    
    // DB Update & Calculation via RPC
    if (dbUserId) {
      try {
        const { data, error } = await supabase.rpc('claim_daily_bonus', { u_id: dbUserId });
        
        if (error) throw error;
        
        if (data && data.success) {
          playSound('fanfare');
          
          // Update Local State with Server Response
          setState(prev => ({
            ...prev,
            userXP: data.new_total_xp,
            currentStreak: data.new_streak,
            dailyClaimed: true
          }));

          // Update Global XP locally to reflect change immediately
          setGlobalXP(prev => prev + data.bonus);
        } else {
          console.warn('Claim failed:', data?.message);
        }
      } catch (err) {
        console.error('Error claiming daily:', err);
      }
    } else {
      // Local / Preview Mode Fallback
      playSound('fanfare');
      const bonus = 100 * Math.pow(2, state.currentStreak - 1);
      setState(prev => ({
        ...prev,
        userXP: prev.userXP + bonus,
        currentStreak: (prev.currentStreak % 5) + 1,
        dailyClaimed: true
      }));
    }
  };

  const startQuest = (task: Task) => {
    initAudio(); 
    window.open(task.link, '_blank');
    setLoadingId(task.id);
    setTimerValue(10);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerValue(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          playSound('reward');
          
          // Optimistic Update
          setState(prev => ({
            ...prev,
            userXP: prev.userXP + task.xp
          }));
          setCompletedTaskIds(prev => new Set(prev).add(task.id));
          setLoadingId(null);

          // DB Update
          if (dbUserId) {
            const completeTaskInDb = async () => {
              let dbTaskId = taskMap[task.id];

              // Fallback: If not in map, try to find it by title in the DB right now
              if (!dbTaskId && dbProjectId) {
                const { data: foundTask } = await supabase
                  .from('tasks')
                  .select('id')
                  .eq('project_id', dbProjectId)
                  .eq('title', task.title)
                  .single();
                if (foundTask) dbTaskId = foundTask.id;
              }

              if (dbTaskId) {
                 await supabase.from('task_completions').insert({
                   user_id: dbUserId,
                   task_id: dbTaskId
                 });
                 
                 // Fetch latest XP to be safe (race conditions)
                 const { data: userProgress } = await supabase
                   .from('user_progress')
                   .select('xp')
                   .eq('user_id', dbUserId)
                   .single();
                 
                 const currentDbXP = userProgress?.xp || state.userXP;

                 await supabase.from('user_progress')
                   .update({ xp: currentDbXP + task.xp }) 
                   .eq('user_id', dbUserId);
                   
                 setGlobalXP(prev => prev + task.xp);
              } else {
                console.error("Task ID not found for completion", task);
              }
            };
            completeTaskInDb();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleShare = (platform: string) => {
    initAudio();
    if (sharedPlatforms.includes(platform) || verifyingPlatforms.includes(platform)) return;
    const shareUrl = window.location.origin;
    
    // Platform-specific marketing copy
    let shareText = '';
    const projectHashtag = `#${state.projectName.replace(/\s+/g, '')}`;
    
    switch(platform) {
      case 'x': 
        shareText = `🚀 Just started my journey on ${state.projectName}! \n\nCompleting quests and earning XP. Join me and level up! ⚡️\n\n${projectHashtag} #QuestLayer #Web3`;
        break;
      case 'tg': 
        shareText = `Check out ${state.projectName} on QuestLayer! 🎮 I'm earning rewards by completing quests. Come join the leaderboard! 🚀`;
        break;
      case 'wa': 
        shareText = `Hey! I'm using QuestLayer to earn rewards on ${state.projectName}. It's actually pretty cool, check it out here:`;
        break;
      case 'li': 
        shareText = `Excited to be engaging with ${state.projectName} through their new QuestLayer integration. Gamifying the experience and earning rewards! 🚀 #Web3 #Community #Growth`;
        break;
      default: // fb and others
        shareText = `Loving the new quest system on ${state.projectName}! 🎮 Earning XP and rewards for engaging with the community. Check it out!`;
        break;
    }

    let url = '';

    switch(platform) {
      case 'x': url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`; break;
      case 'tg': url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`; break;
      case 'wa': url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; break;
      case 'fb': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`; break;
      case 'li': url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; break;
    }

    if (url) {
      window.open(url, '_blank');
      setVerifyingPlatforms(prev => [...prev, platform]);
      if (shareVerifyTimeoutsRef.current[platform]) {
        clearTimeout(shareVerifyTimeoutsRef.current[platform]!);
      }
      shareVerifyTimeoutsRef.current[platform] = setTimeout(() => {
        setVerifyingPlatforms(prev => prev.filter(p => p !== platform));
        if (!sharedPlatforms.includes(platform)) {
          setSharedPlatforms(prev => [...prev, platform]);
          playSound('reward');
          setState(prev => ({ ...prev, userXP: prev.userXP + 100 }));
          
          // DB Update
          if (dbUserId && dbProjectId) {
             // 1. Log completion in DB
             supabase.from('viral_boost_completions').insert({
               user_id: dbUserId,
               project_id: dbProjectId,
               platform: platform
             }).then(() => {
               // 2. Update User XP
               supabase.from('user_progress')
                 .update({ xp: state.userXP + 100 })
                 .eq('user_id', dbUserId)
                 .then(() => {
                    setGlobalXP(prev => prev + 100);
                 });
             });
          }
        }
      }, 10000);
    }
  };

  const handleConnect = () => {
    if (isConnecting) return;
    initAudio();
    open();
  };

  const handleDisconnect = () => {
    if (!isConnected) return;
    isDisconnectingRef.current = true;
    void disconnect();
    setIsOpen(false);
  };

  const getPositionClasses = () => {
    const classes = {
      'bottom-right': 'bottom-2 right-2 md:bottom-8 md:right-8',
      'bottom-left': 'bottom-2 left-2 md:bottom-8 md:left-8',
      'top-right': 'top-2 right-2 md:top-8 md:right-8',
      'top-left': 'top-2 left-2 md:top-8 md:left-8'
    };
    return classes[state.position];
  };

  const isBottom = state.position.includes('bottom');
  const isRight = state.position.includes('right');
  const wrapperClasses = [
    positionClasses,
    'z-[2147483000]',
    'flex',
    activeTheme.font,
    isBottom ? 'flex-col-reverse' : 'flex-col',
    isRight ? 'items-end' : 'items-start',
    getPositionClasses(),
    'gap-2',
    'antialiased'
  ].join(' ');

  const formatXP = (val: number) => val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;

  const currentLevelData = calculateLevel(visualXP);
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
  const triggerStyle = (() => {
    if (isTransparentTheme) {
      return {
        backgroundColor: 'rgba(2, 6, 23, 0.6)', // Darker background (slate-950 at 0.6)
        backdropFilter: 'blur(20px)',
        borderColor: `${state.accentColor}60`,
        boxShadow: `0 0 20px ${state.accentColor}30`,
        color: state.accentColor
      };
    }

    switch (state.activeTheme) {
      case 'cyber':
        return {
          backgroundColor: state.accentColor,
          borderColor: state.accentColor
        };
      case 'gaming':
        return {
          backgroundColor: state.accentColor,
          borderColor: '#fbbf24',
          boxShadow: '4px 4px 0px 0px #fbbf24'
        };
      case 'terminal':
        return {
          borderColor: '#1f3d2a',
          boxShadow: '0 0 0 1px rgba(24, 255, 131, 0.15)'
        };
      case 'aura':
        return {
          borderColor: '#fecdd3',
          boxShadow: '0 0 0 2px rgba(244, 63, 94, 0.08)'
        };
      case 'minimal':
      case 'brutal':
        return {
          borderColor: '#000'
        };
      default:
        return {
          backgroundColor: state.accentColor,
          borderColor: 'transparent'
        };
    }
  })();

  return (
    <>
      {isOpen && (
        <div className={`${positionClasses} inset-0 bg-black/60 md:hidden z-[45]`} onClick={() => setIsOpen(false)} />
      )}

      <div className={`${wrapperClasses} ${isOpen ? (isPreview ? 'max-h-[calc(100%-6rem)]' : 'max-h-[calc(100vh-6rem)]') : ''}`}>
        <button
          onClick={() => {
            if (!isOpen) initAudio();
            setIsOpen(prev => !prev);
          }}
          style={triggerStyle}
          className={`z-40 flex items-center gap-2 md:gap-3 px-4 md:px-6 h-10 md:h-14 shadow-2xl theme-transition font-bold border-2 ${activeTheme.trigger} ${isLightTheme ? 'text-black' : 'text-white'} ${isPreview && !isOpen ? 'animate-[pulse_3s_ease-in-out_infinite] hover:animate-none scale-110 hover:scale-125' : ''}`}
        >
          {!isConnected ? (
            <span className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <Zap className="w-[12px] h-[12px] md:w-[16px] md:h-[16px]" fill="currentColor" />
              Connect
            </span>
          ) : (
            <span className="flex items-center gap-2 md:gap-3">
              <div className="bg-white/10 px-1 py-0.5 rounded text-[8px] md:text-[10px] font-mono tracking-tighter uppercase truncate max-w-[40px] md:max-w-none">
                {shortAddress}
              </div>
              <div className="flex items-center gap-1 border-l border-white/20 pl-1.5 md:pl-2">
                <span className="text-[8px] md:text-[10px] font-black uppercase opacity-60">Lvl</span>
                <span className="text-sm md:text-lg font-black">{currentLevelData.lvl}</span>
              </div>
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className={`w-[min(350px,calc(100vw-1rem))] md:w-[350px] flex flex-col shadow-2xl overflow-hidden border-2 theme-transition relative ${isOpen ? `${isPreview ? 'max-h-[calc(100%-3.5rem)]' : 'max-h-full'}` : ''} ${activeTheme.card} ${activeTheme.font} ${isLightTheme ? 'text-black' : 'text-white'}`}
            style={{
              borderColor: state.activeTheme === 'cyber' ? state.accentColor : (state.activeTheme === 'gaming' ? '#fbbf24' : (isLightTheme ? '#000' : (isTransparentTheme ? `${state.accentColor}60` : 'rgba(255,255,255,0.08)')))
            }}
          >
            {/* Header */}
            <div 
              className={`px-3 py-2.5 md:px-5 md:py-4 flex items-center justify-between shrink-0 ${activeTheme.header}`}
              style={{ borderColor: state.activeTheme === 'gaming' ? '#fbbf24' : undefined }}
            >
              <div className="flex items-center gap-2 md:gap-3 truncate">
                <div
                  style={{ backgroundColor: isLightTheme ? '#000' : (isTransparentTheme ? `${state.accentColor}30` : state.accentColor) }}
                  className={`p-1.5 md:p-2 shadow-lg shrink-0 ${activeTheme.iconBox} ${isTransparentTheme ? '' : 'text-white'}`}
                >
                  <Zap className="w-[10px] h-[10px] md:w-[14px] md:h-[14px]" fill="currentColor" style={isTransparentTheme ? { color: state.accentColor } : {}} />
                </div>
                <span 
                  className={`font-black text-xs md:text-sm uppercase tracking-tight truncate ${isLightTheme ? 'text-black' : 'text-white'}`}
                  style={isTransparentTheme ? { color: state.accentColor } : {}}
                >
                  {state.projectName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-2">
                {isConnected && (
                  <button onClick={handleDisconnect} className="p-1 md:p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                    <LogOut className="w-[10px] h-[10px] md:w-[12px] md:h-[12px]" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={`${isLightTheme ? 'text-slate-400 hover:text-black' : 'text-white/40 hover:text-white'} hover:scale-110 transition-all`}
                >
                  <X className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />
                </button>
              </div>
            </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-5 custom-scroll">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 md:py-8">
              <div className="space-y-2">
                <div 
                  className="mx-auto w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${state.accentColor}15`, color: state.accentColor }}
                >
                  <ShieldCheck className="w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
                </div>
                <h3 className={`text-[11px] md:text-lg font-black uppercase tracking-tighter ${isLightTheme ? 'text-black' : 'text-white'}`}>
                  Connect to unlock <br/><span className="opacity-40 text-xs md:text-sm">{state.projectName} Missions</span>
                </h3>
              </div>
              <div className={`w-full space-y-1.5 text-left p-3 md:p-4 rounded-xl border ${isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>
                  <ChevronRight size={8} /> Protocol Info
                </p>
                <p className={`text-[11px] md:text-xs leading-relaxed ${isLightTheme ? 'text-slate-800' : 'text-slate-300 opacity-70'}`}>
                  Join the ecosystem board to track progress and earn rewards.
                </p>
              </div>
              <button 
                onClick={handleConnect} 
                disabled={isConnecting}
                style={(!isLightTheme && !isTransparentTheme) ? { backgroundColor: state.accentColor } : (isTransparentTheme ? { border: `2px solid ${state.accentColor}`, backgroundColor: `${state.accentColor}10`, color: state.accentColor } : {})} 
                className={`w-full py-2 md:py-3 font-black uppercase tracking-widest text-[10px] md:text-[11px] hover:brightness-110 transition-all flex items-center justify-center gap-2 ${activeTheme.button} ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isConnecting ? (
                  <><Loader2 size={10} className="animate-spin" /> Connecting...</>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 md:space-y-5">
              {/* Progress Card */}
              <div className={`p-2.5 md:p-4 border border-opacity-20 shadow-sm ${activeTheme.itemCard}`}>
                <div className="flex justify-between items-start mb-2 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div 
                      className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center text-xs md:text-lg font-black text-white relative group ${activeTheme.iconBox} ${visualXP < state.userXP ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: isLightTheme ? '#000' : state.accentColor }}
                    >
                      {currentLevelData.lvl}
                      {visualXP < state.userXP && <Sparkles size={6} className="absolute -top-1 -right-1 text-white animate-bounce" />}
                    </div>
                    <div>
                      <p className={`text-[8px] md:text-[10px] font-black uppercase ${isLightTheme ? 'text-slate-500' : 'opacity-60 text-white'}`}>Rank</p>
                      <p className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest ${isLightTheme ? 'text-indigo-700' : 'text-indigo-500'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>{getRankName()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs md:text-xl font-black tabular-nums ${isLightTheme ? 'text-black' : 'text-white'}`}>{currentLevelData.effectiveXP >= 1000 ? (currentLevelData.effectiveXP / 1000).toFixed(1) + 'k' : currentLevelData.effectiveXP}</p>
                    <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-60 text-white'}`}>Rank XP</p>
                  </div>
                </div>
                <div className={`h-1 md:h-2 w-full overflow-hidden border relative mb-1 ${isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-200/10 border-white/5'} ${activeTheme.iconBox}`}>
                  <div 
                    className={`h-full transition-all duration-300 ease-out relative`} 
                    style={{ width: `${currentLevelData.progress}%`, backgroundColor: state.accentColor }}
                  >
                     {visualXP < state.userXP && (
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1s_infinite]" />
                     )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[8px] md:text-[9px] font-bold uppercase ${isLightTheme ? 'text-slate-400' : 'text-white/40'}`}>
                    Quest XP: <span className={isLightTheme ? 'text-slate-600' : 'text-white/70'}>{visualXP}</span>
                  </p>
                  <p className={`text-[8px] md:text-[9px] font-bold uppercase ${isLightTheme ? 'text-indigo-600' : 'text-indigo-400'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>
                    {currentLevelData.xpNeeded} XP to Lvl {currentLevelData.lvl + 1}
                  </p>
                </div>
              </div>

              {/* Streak Section */}
              <div className="space-y-1.5 md:space-y-3">
                <div className="flex justify-between items-center px-1">
                  <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                    Multipliers
                  </p>
                  <p className={`text-[8px] md:text-[10px] font-black uppercase flex items-center gap-1 ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'}`} style={!isLightTheme ? { color: state.accentColor } : {}}>
                    <Flame size={8} /> {state.currentStreak}D STREAK
                  </p>
                </div>
                <div className="flex gap-1 justify-between">
                  {[1, 2, 3, 4, 5].map(day => {
                    const isActive = day <= state.currentStreak;
                    const isCurrent = day === state.currentStreak;
                    return (
                      <div 
                        key={day}
                        className={`flex-1 h-8 md:h-12 border flex flex-col items-center justify-center transition-all duration-500 relative ${activeTheme.iconBox} ${
                          isActive 
                            ? (isLightTheme ? 'border-transparent shadow-sm' : 'border-transparent shadow-md') 
                            : (isLightTheme ? 'border-slate-200 opacity-20' : 'border-white/5 opacity-10')
                        } ${isCurrent ? 'ring-1 md:ring-2 ring-offset-1 md:ring-offset-2' : ''}`}
                        style={{
                          borderColor: isActive ? state.accentColor : undefined,
                          backgroundColor: isActive ? `${state.accentColor}${isLightTheme ? '10' : '20'}` : undefined,
                          '--tw-ring-color': isCurrent ? state.accentColor : 'transparent',
                          ringOffsetColor: isLightTheme ? '#ffffff' : '#0f172a',
                          boxShadow: (isActive && state.activeTheme === 'gaming') ? `2px 2px 0px 0px #fbbf24` : undefined
                        } as React.CSSProperties}
                      >
                        <span className={`text-[7px] md:text-[9px] font-black uppercase ${isActive ? (isLightTheme ? 'text-slate-900' : 'text-white') : (isLightTheme ? 'text-black' : 'text-white')}`}>D{day}</span>
                        <span 
                          className={`text-[9px] md:text-[11px] font-mono font-bold transition-colors`}
                          style={{ color: isActive ? state.accentColor : (isLightTheme ? '#64748b' : 'rgba(255,255,255,0.4)') }}
                        >
                          {formatXP(100 * Math.pow(2, day - 1))}
                        </span>
                        {isActive && (
                           <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                             <CheckCircle2 size={6} style={{ color: state.accentColor }} />
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!state.dailyClaimed ? (
                  <button 
                    onClick={claimDaily} 
                    style={(!isLightTheme && !isTransparentTheme) ? { 
                      backgroundColor: state.activeTheme === 'gaming' ? '#f59e0b' : state.accentColor,
                      borderColor: state.activeTheme === 'gaming' ? '#b45309' : state.accentColor 
                    } : (isTransparentTheme ? { 
                      border: `2px solid ${state.accentColor}`, 
                      backgroundColor: `${state.accentColor}20` 
                    } : (isLightTheme ? { 
                      backgroundColor: state.accentColor, 
                      color: 'white' 
                    } : {}))} 
                    className={`w-full py-1.5 md:py-3 font-black text-[10px] md:text-[11px] uppercase tracking-widest ${activeTheme.button} hover:scale-[1.01] transition-transform`}
                  >
                    Claim Daily Bonus
                  </button>
                ) : (
                  <div className={`w-full py-1.5 md:py-2.5 text-center text-[9px] md:text-[10px] font-black uppercase border flex items-center justify-center gap-1.5 ${isLightTheme ? 'border-slate-200 text-slate-400' : 'opacity-30 text-white border-white/5'} ${activeTheme.iconBox}`}>
                    <Trophy size={8} /> Bonus Stashed
                  </div>
                )}
              </div>

              {/* Viral Boost Section */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                    Viral Boost
                  </p>
                  <p className={`text-[8px] md:text-[10px] font-black uppercase ${isLightTheme ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    +100 XP EACH
                  </p>
                </div>
                <div 
                  className={`p-2 md:p-4 border border-opacity-10 shadow-sm flex flex-col items-center gap-2 ${activeTheme.itemCard}`}
                  style={{ 
                    borderColor: state.activeTheme === 'gaming' ? `#fbbf2440` : undefined,
                    boxShadow: state.activeTheme === 'gaming' ? `3px 3px 0px 0px #fbbf2420` : undefined
                  }}
                >
                  <div className="flex gap-2.5 md:gap-5 items-center justify-center w-full">
                    {[
                      { id: 'x', icon: <Twitter size={12} />, color: '#000000' },
                      { id: 'tg', icon: <Send size={12} />, color: '#0088cc' },
                      { id: 'wa', icon: <MessageSquare size={12} />, color: '#25D366' },
                      { id: 'fb', icon: <Facebook size={12} />, color: '#1877F2' },
                      { id: 'li', icon: <Linkedin size={12} />, color: '#0A66C2' }
                    ].map(platform => {
                      const isShared = sharedPlatforms.includes(platform.id);
                      const isVerifying = verifyingPlatforms.includes(platform.id);
                      return (
                        <button 
                          key={platform.id}
                          onClick={() => handleShare(platform.id)}
                          className={`relative w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90 hover:scale-105 ${isShared ? 'grayscale opacity-10 pointer-events-none' : ''} ${isVerifying ? 'pointer-events-none' : ''}`}
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.icon}
                          {isVerifying && (
                            <svg
                              className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90"
                              viewBox="0 0 40 40"
                            >
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth="3"
                              />
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                className="ql-share-progress"
                                style={{ animationDuration: '10s' }}
                              />
                            </svg>
                          )}
                          {isShared && (
                            <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5 border border-slate-100 shadow-sm">
                               <CheckCircle2 size={6} className="text-emerald-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Missions Board */}
              <div className="space-y-2 md:space-y-3">
                <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-1 ${isLightTheme ? 'text-slate-500' : 'opacity-40 text-white'}`}>
                  Missions
                </p>
                <div className="space-y-2 md:space-y-3 pb-2">
                  {[...state.tasks].sort((a, b) => {
                    const aCompleted = completedTaskIds.has(a.id);
                    const bCompleted = completedTaskIds.has(b.id);
                    if (aCompleted === bCompleted) return 0;
                    return aCompleted ? 1 : -1;
                  }).map(task => {
                    const isCompleted = completedTaskIds.has(task.id);
                    return (
                    <div 
                        key={task.id} 
                        className={`p-2 md:p-3.5 border border-opacity-20 shadow-sm transition-all relative overflow-hidden ${activeTheme.itemCard} ${isCompleted ? 'opacity-60 grayscale-[0.8]' : ''}`}
                        style={{ 
                          borderColor: state.activeTheme === 'gaming' ? `#fbbf2440` : undefined,
                          boxShadow: state.activeTheme === 'gaming' ? `3px 3px 0px 0px #fbbf2420` : undefined
                        }}
                      >
                      <div className="flex justify-between items-start mb-0.5 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {task.icon?.startsWith('icon:') ? (
                            <div 
                              className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center overflow-hidden ${activeTheme.iconBox}`}
                              style={{ background: `${state.accentColor}10` }}
                            >
                              {task.icon === 'icon:coin' && <Coins size={14} className="text-yellow-400" />}
                              {task.icon === 'icon:trophy' && <Trophy size={14} className="text-yellow-400" />}
                              {task.icon === 'icon:gem' && <Gem size={14} className="text-yellow-400" />}
                              {task.icon === 'icon:sword' && <Sword size={14} className="text-yellow-400" />}
                              {task.icon === 'icon:crown' && <Crown size={14} className="text-yellow-400" />}
                            </div>
                          ) : task.icon ? (
                            <div 
                              className={`flex h-5 w-5 md:h-6 md:w-6 items-center justify-center overflow-hidden ${activeTheme.iconBox}`}
                              style={{ background: `${state.accentColor}10` }}
                            >
                              <img
                                src={task.icon}
                                alt=""
                                className="h-4 w-4 md:h-5 md:w-5 object-contain"
                                loading="lazy"
                              />
                            </div>
                          ) : null}
                          <h5 className={`text-[10px] md:text-xs font-black uppercase tracking-tight truncate ${isLightTheme ? 'text-black' : 'text-white'} ${isCompleted ? 'line-through decoration-2' : ''}`}>
                            {task.title}
                          </h5>
                        </div>
                        <span 
                          className={`text-[8px] md:text-[10px] font-black px-1 py-0.5 shrink-0 ${activeTheme.iconBox}`}
                          style={{ background: `${state.accentColor}10`, color: state.accentColor }}
                        >
                          +{task.xp}
                        </span>
                      </div>
                      <p className={`text-[9px] md:text-[11px] mb-2 leading-relaxed line-clamp-2 ${isLightTheme ? 'text-slate-700' : 'opacity-60 text-white'}`}>
                        {task.desc}
                      </p>
                      <button 
                        onClick={() => startQuest(task)} 
                        disabled={isCompleted || (loadingId !== null && loadingId !== task.id)}
                        style={(!isLightTheme && !isTransparentTheme) ? { 
                          backgroundColor: isCompleted ? '#94a3b8' : (state.activeTheme === 'gaming' ? '#f59e0b' : state.accentColor),
                          borderColor: isCompleted ? '#94a3b8' : (state.activeTheme === 'gaming' ? '#b45309' : state.accentColor),
                          color: state.activeTheme === 'gaming' ? 'black' : 'white',
                          cursor: isCompleted ? 'not-allowed' : 'pointer'
                        } : (isTransparentTheme ? { 
                          borderColor: isCompleted ? '#94a3b8' : state.accentColor, 
                          backgroundColor: isCompleted ? '#94a3b820' : (loadingId === task.id ? `${state.accentColor}10` : 'transparent'),
                          color: isCompleted ? '#94a3b8' : 'white',
                          cursor: isCompleted ? 'not-allowed' : 'pointer'
                        } : (loadingId === task.id ? { 
                          backgroundColor: '#f8fafc', 
                          color: '#1e293b', 
                          borderColor: '#cbd5e1' 
                        } : { 
                          backgroundColor: isCompleted ? '#e2e8f0' : state.accentColor, 
                          color: isCompleted ? '#94a3b8' : 'white', 
                          borderColor: isCompleted ? '#e2e8f0' : state.accentColor,
                          cursor: isCompleted ? 'not-allowed' : 'pointer'
                        }))} 
                        className={`w-full h-7 md:h-9 border-2 font-black text-[9px] md:text-[10px] uppercase transition-all flex items-center justify-center relative z-10 tracking-widest ${activeTheme.button}`}
                      >
                        {isCompleted ? (
                           <span className="flex items-center gap-1">Completed <CheckCircle2 size={10} /></span>
                        ) : loadingId !== task.id ? (
                          <span className="flex items-center gap-1">Launch <ExternalLink size={7} /></span>
                        ) : (
                          <span className="flex items-center gap-1">Syncing <span className={`font-mono`} style={{ color: state.accentColor }}>{timerValue}s</span></span>
                        )}
                        {loadingId === task.id && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-1000 linear" 
                            style={{ width: `${((10 - timerValue) / 10) * 100}%`, backgroundColor: state.accentColor }} 
                          />
                        )}
                      </button>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className={`p-2 md:p-3 border-t shrink-0 flex items-center justify-center gap-1.5 ${activeTheme.header}`}
          style={{ borderColor: state.activeTheme === 'gaming' ? state.accentColor : undefined }}
        >
          <Zap className={`${isLightTheme ? 'text-black' : 'text-indigo-500'} fill-current w-[8px] h-[8px] md:w-[10px] md:h-[10px]`} style={!isLightTheme ? { color: state.accentColor } : {}} />
          <a
            href="https://questlayer.questgalaxy.com/"
            target="_blank"
            rel="noreferrer"
            className={`text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] ${isLightTheme ? 'text-slate-500' : 'opacity-30 text-white'} hover:opacity-80 transition-opacity`}
          >
            QuestLayer Engine v2.5
          </a>
        </div>
      </div>
        )}
      </div>
      <style>{`
        .ql-share-progress {
          stroke-dasharray: 113;
          stroke-dashoffset: 113;
          animation-name: ql-share-progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes ql-share-progress {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
};

export default Widget;
