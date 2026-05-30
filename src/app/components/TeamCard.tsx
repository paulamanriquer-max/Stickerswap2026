import { ChevronRight } from 'lucide-react';

interface TeamCardProps {
  name: string;
  code: string;
  flag: string;
  owned: number;
  missing: number;
  duplicates: number;
  total: number;
  onClick?: () => void;
}

export function TeamCard({ name, code, flag, owned, missing, duplicates, total, onClick }: TeamCardProps) {
  const completionPercent = Math.round((owned / total) * 100);

  return (
    <button
      onClick={onClick}
      className="w-full bg-card/30 hover:bg-card/40 rounded-2xl border border-border/50 shadow-lg active:scale-[0.98] transition-all overflow-hidden"
    >
      <div className="flex items-center gap-2.5 p-2.5">
        <div className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-lg flex-shrink-0">{flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
            <span className="text-xs font-bold text-primary ml-2">{completionPercent}%</span>
          </div>
          <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-primary transition-all duration-500 shadow-sm shadow-primary/50"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
            <span>{owned}/{total}</span>
            {duplicates > 0 && <span className="text-info font-semibold">{duplicates} dupes</span>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}
