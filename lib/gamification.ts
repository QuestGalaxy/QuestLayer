
/**
 * Gamification Logic for QuestLayer
 */

export interface Tier {
    name: string;
    minLevel: number;
    icon: string;
    color: string;
}

export const TIERS: Tier[] = [
    { name: 'Bronze Explorer', minLevel: 1, icon: '🥉', color: 'text-orange-400' },
    { name: 'Silver Questant', minLevel: 11, icon: '🥈', color: 'text-slate-300' },
    { name: 'Gold Vanguard', minLevel: 26, icon: '🥇', color: 'text-yellow-400' },
    { name: 'Platinum Legend', minLevel: 51, icon: '💎', color: 'text-cyan-400' },
    { name: 'Mythic Overlord', minLevel: 101, icon: '🌌', color: 'text-purple-400' },
];

/**
 * Calculates current level from total XP using a parabolic scaling curve.
 * Formula: Level = floor((XP / 1000)^(2/3)) + 1
 */
export const calculateLevel = (xp: number): number => {
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / 1000, 2 / 3)) + 1;
};

/**
 * Calculates the total XP required to REACH a specific level.
 * Formula: XP = 1000 * (Level - 1)^1.5
 */
export const calculateXpForLevel = (level: number): number => {
    if (level <= 1) return 0;
    return Math.floor(1000 * Math.pow(level - 1, 1.5));
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
