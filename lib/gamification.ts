
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
    { name: 'Rookie', minLevel: 1, icon: '👣', color: 'text-slate-500' },
    { name: 'Bronze Explorer', minLevel: 3, icon: '🥉', color: 'text-orange-400' },
    { name: 'Silver Questant', minLevel: 11, icon: '🥈', color: 'text-slate-300' },
    { name: 'Gold Vanguard', minLevel: 26, icon: '🥇', color: 'text-yellow-400' },
    { name: 'Platinum Legend', minLevel: 51, icon: '💎', color: 'text-cyan-400' },
    { name: 'Mythic Overlord', minLevel: 101, icon: '🌌', color: 'text-purple-400' },
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
