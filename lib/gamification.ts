
/**
 * Gamification Logic for QuestLayer
 */

export interface Tier {
    name: string;
    minLevel: number;
    icon: string;
    color: string;
    textGradient: string;
    bgGradient: string;
    glow: string;
    shadow: string;
}

export const TIERS: Tier[] = [
    {
        name: 'Rookie',
        minLevel: 1,
        icon: 'pixel-coin',
        color: 'text-slate-400',
        textGradient: 'from-slate-400 to-slate-500',
        bgGradient: 'from-slate-500/20 to-slate-600/10',
        glow: 'group-hover:shadow-slate-500/20',
        shadow: 'shadow-slate-500/10'
    },
    {
        name: 'Bronze Explorer',
        minLevel: 3,
        icon: 'pixel-star',
        color: 'text-orange-400',
        textGradient: 'from-orange-400 to-amber-600',
        bgGradient: 'from-orange-500/20 to-amber-600/10',
        glow: 'group-hover:shadow-orange-500/40',
        shadow: 'shadow-orange-500/20'
    },
    {
        name: 'Silver Questant',
        minLevel: 11,
        icon: 'pixel-shield',
        color: 'text-slate-200',
        textGradient: 'from-slate-200 to-slate-400',
        bgGradient: 'from-slate-300/20 to-slate-500/10',
        glow: 'group-hover:shadow-slate-300/40',
        shadow: 'shadow-slate-300/20'
    },
    {
        name: 'Gold Vanguard',
        minLevel: 26,
        icon: 'pixel-crown',
        color: 'text-yellow-400',
        textGradient: 'from-yellow-300 to-amber-500',
        bgGradient: 'from-yellow-400/20 to-amber-500/10',
        glow: 'group-hover:shadow-yellow-400/50',
        shadow: 'shadow-yellow-400/30'
    },
    {
        name: 'Platinum Legend',
        minLevel: 51,
        icon: 'pixel-dragon',
        color: 'text-cyan-400',
        textGradient: 'from-cyan-300 to-blue-500',
        bgGradient: 'from-cyan-400/20 to-blue-500/10',
        glow: 'group-hover:shadow-cyan-400/60',
        shadow: 'shadow-cyan-400/40'
    },
    {
        name: 'Mythic Overlord',
        minLevel: 101,
        icon: 'pixel-phoenix',
        color: 'text-purple-400',
        textGradient: 'from-purple-400 via-fuchsia-400 to-indigo-500',
        bgGradient: 'from-purple-500/30 via-fuchsia-500/20 to-indigo-500/30',
        glow: 'group-hover:shadow-purple-500/80',
        shadow: 'shadow-purple-500/50'
    },
];

/**
 * Calculates current level from total XP using a much steeper RPG scaling curve.
 * Formula: Level = floor((XP / 2000)^(1/2.2)) + 1
 */
export const calculateLevel = (xp: number): number => {
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / 2000, 1 / 2.2)) + 1;
};

/**
 * Calculates the total XP required to REACH a specific level.
 * Formula: XP = 2000 * (Level - 1)^2.2
 */
export const calculateXpForLevel = (level: number): number => {
    if (level <= 1) return 0;
    return Math.floor(2000 * Math.pow(level - 1, 2.2));
};

/**
 * Gets the current tier information based on level.
 */
export const getTier = (level: number): Tier => {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (level >= TIERS[i].minLevel) {
            return TIERS[i];
        }
    }
    return TIERS[0];
};

/**
 * Calculates progress information for the current level.
 */
export const getLevelProgress = (xp: number) => {
    const currentLevel = calculateLevel(xp);
    const xpAtCurrentLevelStart = calculateXpForLevel(currentLevel);
    const xpAtNextLevelStart = calculateXpForLevel(currentLevel + 1);

    const xpInCurrentLevel = xp - xpAtCurrentLevelStart;
    const xpRequiredForNextLevel = xpAtNextLevelStart - xpAtCurrentLevelStart;

    return {
        level: currentLevel,
        tier: getTier(currentLevel),
        xpInLevel: xpInCurrentLevel,
        xpRequired: xpRequiredForNextLevel,
        totalToNext: xpAtNextLevelStart,
        progress: Math.min((xpInCurrentLevel / xpRequiredForNextLevel) * 100, 100)
    };
};
