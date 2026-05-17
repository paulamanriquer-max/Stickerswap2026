import { MoreVertical, Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

type StickerStatus = 'owned' | 'missing' | 'duplicate';

interface StickerCardProps {
  code: string;
  playerName: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
  onClick?: () => void;
  onStatusChange?: (newStatus: StickerStatus) => void;
  onDuplicateCountChange?: (newCount: number) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function StickerCard({ code, playerName, owned, missing, duplicateCount, onClick, onStatusChange, onDuplicateCountChange, onDelete, readOnly = false }: StickerCardProps) {
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Check if sticker has any status
  const hasStatus = owned || missing || duplicateCount > 0;

  // Derive primary status for action sheet logic
  const status: StickerStatus = missing ? 'missing' : duplicateCount > 0 ? 'duplicate' : owned ? 'owned' : 'owned';

  const openActionSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionSheet(true);
  };

  const closeActionSheet = () => {
    setShowActionSheet(false);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'owned':
        onStatusChange?.('owned');
        break;
      case 'missing':
        onStatusChange?.('missing');
        break;
      case 'duplicate':
        onStatusChange?.('duplicate');
        break;
      case 'delete':
        onDelete?.();
        break;
      case 'increment':
        onDuplicateCountChange?.(duplicateCount + 1);
        return; // Don't close sheet for counter actions
      case 'decrement':
        if (duplicateCount > 1) {
          onDuplicateCountChange?.(duplicateCount - 1);
        }
        return; // Don't close sheet for counter actions
    }
    closeActionSheet();
  };

  const getStatusLabels = () => {
    // For read-only cards (e.g., "They have, you need"), show simple "Available" badge
    if (readOnly && (owned || duplicateCount > 0)) {
      return (
        <div className="flex items-center px-2 py-1 rounded-md bg-primary/20 border border-primary/40 h-6">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary leading-none">Available</span>
        </div>
      );
    }

    // For your own cards, show detailed status
    const labels = [];

    if (owned) {
      labels.push(
        <div key="owned" className="flex items-center px-2 py-1 rounded-md bg-success/20 border border-success/40 h-6">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-success leading-none">Owned</span>
        </div>
      );
    }

    if (duplicateCount > 0) {
      labels.push(
        <div key="duplicate" className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/20 border border-secondary/40 h-6">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary leading-none">Duplicate</span>
          {duplicateCount > 1 && (
            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-secondary text-secondary-foreground">
              <span className="text-[9px] font-bold">{duplicateCount}</span>
            </div>
          )}
        </div>
      );
    }

    if (missing) {
      labels.push(
        <div key="missing" className="flex items-center px-2 py-1 rounded-md bg-destructive/20 border border-destructive/40 h-6">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-destructive leading-none">Missing</span>
        </div>
      );
    }

    return labels.length > 0 ? labels : null;
  };

  return (
    <>
      <div className="w-full p-3 rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl hover:bg-card/40 shadow-lg transition-all relative group">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={onClick}
            className="flex-1 text-left min-w-0 cursor-pointer"
          >
            <div className="font-bold text-foreground text-sm">{code}</div>
            <div className="text-sm text-muted-foreground mt-0.5 truncate">{playerName}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusLabels()}
            {onStatusChange && !readOnly && (
              <button
                onClick={openActionSheet}
                className="w-8 h-8 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 flex items-center justify-center transition-all active:scale-95"
                title="Actions"
              >
                <MoreVertical className="w-4 h-4 text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Sheet */}
      {showActionSheet && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={closeActionSheet}>
          <div
            className="w-full bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto border-t border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-foreground text-lg">{code}</h3>
                <p className="text-sm text-muted-foreground">{playerName}</p>
              </div>
              <button
                onClick={closeActionSheet}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/30 active:scale-90 transition-transform"
              >
                <span className="text-foreground text-xl">×</span>
              </button>
            </div>

            <div className="space-y-2">
              {/* Actions based on status */}
              {!hasStatus && (
                <>
                  <button
                    onClick={() => handleAction('owned')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Owned</span>
                  </button>
                  <button
                    onClick={() => handleAction('missing')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Missing</span>
                  </button>
                  <button
                    onClick={() => handleAction('duplicate')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Duplicate</span>
                  </button>
                </>
              )}

              {hasStatus && status === 'owned' && !duplicateCount && (
                <>
                  <button
                    onClick={() => handleAction('missing')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Missing</span>
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full p-4 bg-destructive/10 hover:bg-destructive/20 rounded-xl border border-destructive/30 transition-all active:scale-95 text-left flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="font-semibold text-destructive">Delete</span>
                  </button>
                </>
              )}

              {hasStatus && owned && duplicateCount > 0 && (
                <>
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <label className="block text-sm font-semibold text-foreground mb-3">Duplicate Count</label>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleAction('decrement')}
                        disabled={duplicateCount <= 1}
                        className="w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-5 h-5 text-primary" />
                      </button>
                      <span className="text-3xl font-bold text-foreground">{duplicateCount}</span>
                      <button
                        onClick={() => handleAction('increment')}
                        className="w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-primary" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction('missing')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Missing</span>
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full p-4 bg-destructive/10 hover:bg-destructive/20 rounded-xl border border-destructive/30 transition-all active:scale-95 text-left flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="font-semibold text-destructive">Delete</span>
                  </button>
                </>
              )}

              {hasStatus && status === 'missing' && (
                <>
                  <button
                    onClick={() => handleAction('owned')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Owned</span>
                  </button>
                  <button
                    onClick={() => handleAction('duplicate')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Duplicate</span>
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full p-4 bg-destructive/10 hover:bg-destructive/20 rounded-xl border border-destructive/30 transition-all active:scale-95 text-left flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="font-semibold text-destructive">Delete</span>
                  </button>
                </>
              )}

              {hasStatus && !owned && duplicateCount > 0 && (
                <>
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <label className="block text-sm font-semibold text-foreground mb-3">Duplicate Count</label>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleAction('decrement')}
                        disabled={duplicateCount <= 1}
                        className="w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-5 h-5 text-primary" />
                      </button>
                      <span className="text-3xl font-bold text-foreground">{duplicateCount}</span>
                      <button
                        onClick={() => handleAction('increment')}
                        className="w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-primary" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction('owned')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Owned</span>
                  </button>
                  <button
                    onClick={() => handleAction('missing')}
                    className="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all active:scale-95 text-left"
                  >
                    <span className="font-semibold text-foreground">Mark as Missing</span>
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full p-4 bg-destructive/10 hover:bg-destructive/20 rounded-xl border border-destructive/30 transition-all active:scale-95 text-left flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="font-semibold text-destructive">Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
