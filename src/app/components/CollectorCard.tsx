import { MapPin, ArrowRightLeft } from 'lucide-react';
import { DistanceBadge } from './DistanceBadge';
import { MatchScoreBadge } from './MatchScoreBadge';

interface CollectorCardProps {
  username: string;
  distance: string;
  matchScore: number;
  theyHaveYouNeed: number;
  youHaveTheyNeed: number;
  onClick?: () => void;
  locationEnabled: boolean;
  city: string;
}

export function CollectorCard({
  username,
  distance,
  matchScore,
  theyHaveYouNeed,
  youHaveTheyNeed,
  onClick,
  locationEnabled,
  city,
}: CollectorCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card/30 backdrop-blur-xl hover:bg-card/40 rounded-xl border border-border/50 shadow-lg active:scale-[0.98] transition-all"
    >
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <span className="text-primary-foreground font-bold text-xs">{username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="text-left min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">{username}</h3>
              <DistanceBadge distance={locationEnabled ? distance : city} />
            </div>
          </div>
          <MatchScoreBadge score={matchScore} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
            <div className="text-xl font-bold text-foreground">{theyHaveYouNeed}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">You need</div>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
            <div className="text-xl font-bold text-foreground">{youHaveTheyNeed}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">They need</div>
          </div>
        </div>
      </div>
    </button>
  );
}
