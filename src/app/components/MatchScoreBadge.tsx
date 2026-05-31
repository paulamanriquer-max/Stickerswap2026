import { ArrowRightLeft } from 'lucide-react';

interface MatchScoreBadgeProps {
  score: number;
}

export function MatchScoreBadge({ score }: MatchScoreBadgeProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/50 bg-card/50 backdrop-blur-sm">
      <ArrowRightLeft className="w-3 h-3 text-primary" />
      <span className="font-bold text-foreground text-xs">Match {score}%</span>
    </div>
  );
}
