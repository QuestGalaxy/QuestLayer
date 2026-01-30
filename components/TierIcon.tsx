import React from 'react';
import { Coins, Star, Shield, Crown, Trophy, Zap, Bird } from 'lucide-react';

interface TierIconProps {
    icon: string;
    className?: string;
    size?: number;
}

const TierIcon: React.FC<TierIconProps> = ({ icon, className = '', size = 32 }) => {
    const resolveIconPath = (path: string) => new URL(path, import.meta.url).toString();

    const getIconPath = () => {
        switch (icon) {
            case 'pixel-coin': return resolveIconPath('/tiers/rookie.png');
            case 'pixel-star': return resolveIconPath('/tiers/bronze.png');
            case 'pixel-shield': return resolveIconPath('/tiers/silver.png');
            case 'pixel-crown': return resolveIconPath('/tiers/gold.png');
            case 'pixel-dragon': return resolveIconPath('/tiers/platinum.png');
            case 'pixel-phoenix': return resolveIconPath('/tiers/Mythic.png');
            default: return null;
        }
    };

    const iconPath = getIconPath();

    if (!iconPath) return <span>{icon}</span>;

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <div
                className="flex items-center justify-center transition-all duration-300 transform group-hover:scale-110"
                style={{
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 8px rgba(255, 191, 0, 0.4))'
                }}
            >
                <img
                    src={iconPath}
                    alt={icon}
                    style={{ width: size, height: size }}
                    className="object-contain"
                    onError={(e) => {
                        // Case-sensitivity fallback for Mythic.png if needed
                        const img = e.target as HTMLImageElement;
                        if (icon === 'pixel-phoenix' && !img.dataset.triedLower) {
                            img.dataset.triedLower = 'true';
                            img.src = resolveIconPath('/tiers/mythic.png');
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default TierIcon;
