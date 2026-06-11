import { StickerCard } from '../components/StickerCard';
import { SearchBar } from '../components/SearchBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { ChevronLeft, Check, Share2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { getTeamByCode } from '../data/teams';
import { getPlayersByTeam } from '../data/players';
import { getTeamColors } from '../data/teamColors';
import { StickerStatus } from '../lib/stickerState';
import { buildStickerShareText, shareStickerText } from '../lib/shareStickers';

interface Sticker {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
}

interface TeamDetailScreenProps {
  teamCode: string;
  onBack: () => void;
  onStickerClick: (code: string) => void;
  stickers: Sticker[];
  onUpdateSticker: (code: string, updates: Partial<Sticker>) => void;
  onDeleteSticker: (code: string) => void;
}

function SelectableTeamStickerCard({
  sticker,
  selected,
  onToggle,
}: {
  sticker: Sticker & { playerName: string };
  selected: boolean;
  onToggle: (code: string) => void;
}) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <button
      type="button"
      onPointerDown={(event) => {
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (start) {
          const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
          if (moved > 8) return;
        }
        onToggle(sticker.code);
      }}
      className={`w-full touch-manipulation select-none flex items-center gap-3 px-3 py-3 bg-card/40 border rounded-xl text-left transition-none ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border/50'
      }`}
    >
      <span className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 ${
        selected
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-border bg-background/60'
      }`}>
        {selected && <Check className="w-4 h-4" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-foreground">{sticker.code}</span>
        <span className="block text-xs text-muted-foreground truncate">{sticker.playerName}</span>
      </span>
      {sticker.duplicateCount > 0 && (
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
          x{sticker.duplicateCount}
        </span>
      )}
    </button>
  );
}

export function TeamDetailScreen({ teamCode, onBack, onStickerClick, stickers, onUpdateSticker, onDeleteSticker }: TeamDetailScreenProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<StickerStatus | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');

  const team = getTeamByCode(teamCode);
  const teamPlayers = getPlayersByTeam(teamCode);
  const colors = getTeamColors(teamCode);

  const allTeamStickers = teamPlayers.map((player) => {
    const existingSticker = stickers.find(s => s.code === player.code || s.code.replace(/\s+/g, '') === player.stickerNumber);

    return {
      code: player.code,
      owned: existingSticker?.owned || false,
      missing: existingSticker ? existingSticker.missing : true,
      duplicateCount: existingSticker?.duplicateCount || 0,
      playerName: player.name,
    };
  });

  const displayStickers = allTeamStickers;

  const handleStatusChange = (code: string, newStatus: 'owned' | 'missing' | 'duplicate') => {
    const existingSticker = stickers.find(s => s.code === code);

    if (!existingSticker) {
      // Create new sticker if it doesn't exist
      const newSticker: Partial<Sticker> = {
        code,
        owned: newStatus === 'owned' || newStatus === 'duplicate',
        missing: newStatus === 'missing',
        duplicateCount: newStatus === 'duplicate' ? 1 : 0,
      };
      onUpdateSticker(code, newSticker);
    } else {
      // Update existing sticker
      if (newStatus === 'owned') {
        onUpdateSticker(code, { owned: true, missing: false, duplicateCount: 0 });
      } else if (newStatus === 'missing') {
        onUpdateSticker(code, { missing: true, owned: false, duplicateCount: 0 });
      } else if (newStatus === 'duplicate') {
        onUpdateSticker(code, { owned: true, duplicateCount: Math.max(1, existingSticker.duplicateCount), missing: false });
      }
    }
  };

  const handleDuplicateCountChange = (code: string, newCount: number) => {
    onUpdateSticker(code, {
      owned: true,
      missing: false,
      duplicateCount: Math.max(0, newCount),
    });
  };

  const handleDelete = (code: string) => {
    onUpdateSticker(code, { owned: false, missing: true, duplicateCount: 0 });
  };

  const toggleCode = (code: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const cancelSelecting = () => {
    setIsSelecting(false);
    setSelectedCodes(new Set());
    setPendingAction(null);
  };

  const selectAll = () => {
    setSelectedCodes(new Set(filteredStickers.map(sticker => sticker.code)));
  };

  const shareCurrentList = async () => {
    const isDupes = filter === 'duplicate';
    const label = `${team.name} ${isDupes ? 'dupes' : 'missing'}`;
    const text = buildStickerShareText(label, filteredStickers, isDupes);
    try {
      const result = await shareStickerText(`StickerSwap KC - ${label}`, text);
      setShareFeedback(result === 'copied' ? 'List copied to clipboard' : 'Share sheet opened');
      window.setTimeout(() => setShareFeedback(''), 2500);
    } catch {
      setShareFeedback('Could not share. Try again.');
      window.setTimeout(() => setShareFeedback(''), 2500);
    }
  };

  const confirmBulkAction = () => {
    if (!pendingAction || selectedCodes.size === 0) return;
    selectedCodes.forEach(code => handleStatusChange(code, pendingAction));
    cancelSelecting();
  };

  const filteredStickers = displayStickers.filter(s => {
    // Filter by status
    if (filter === 'owned' && !s.owned) return false;
    if (filter === 'missing' && !s.missing) return false;
    if (filter === 'duplicate' && s.duplicateCount === 0) return false;

    // Filter by search
    if (search && !s.code.toLowerCase().includes(search.toLowerCase()) &&
        !s.playerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    collected: displayStickers.filter(s => s.owned || s.duplicateCount > 0).length,
    owned: displayStickers.filter(s => s.owned).length,
    missing: displayStickers.filter(s => s.missing).length,
    duplicates: displayStickers.filter(s => s.duplicateCount > 0).length,
  };

  const totalStickers = team.total || 20;
  const completionPercent = displayStickers.length > 0
    ? Math.round((stats.collected / totalStickers) * 100)
    : 0;

  return (
    <div className={`min-h-screen bg-background ${isSelecting ? 'pb-40' : 'pb-20'}`}>
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="text-5xl">{team.flag}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">{team.name}</h1>
            <p className="text-sm text-muted-foreground">{totalStickers} stickers total</p>
          </div>
        </div>

        <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50 shadow-lg mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Progress</span>
            <span className="text-xl font-bold text-primary">{completionPercent}%</span>
          </div>

          <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary transition-all duration-500 shadow-lg shadow-primary/50"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{stats.owned}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Owned</span>
            </div>
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{stats.missing}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Missing</span>
            </div>
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{stats.duplicates}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Dupes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or number..."
          />
        </div>

        <div className="mb-4">
          <SegmentedControl
            options={[
              { value: 'all', label: 'All' },
              { value: 'owned', label: 'Owned' },
              { value: 'missing', label: 'Missing' },
              { value: 'duplicate', label: 'Dupes' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between gap-3">
            <h3>
              {filter === 'all' && `All Stickers (${filteredStickers.length})`}
              {filter === 'owned' && `Owned (${filteredStickers.length})`}
              {filter === 'missing' && `Missing (${filteredStickers.length})`}
              {filter === 'duplicate' && `Dupes (${filteredStickers.length})`}
            </h3>
            {!isSelecting && filteredStickers.length > 0 && (filter === 'missing' || filter === 'duplicate') && (
              <div className="flex items-center gap-4">
                <button
                  onClick={shareCurrentList}
                  className="flex items-center gap-1 px-1 py-2 text-primary text-base font-bold active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  onClick={() => setIsSelecting(true)}
                  className="px-1 py-2 text-primary text-base font-bold active:scale-95 transition-all"
                >
                  Select
                </button>
              </div>
            )}
            {isSelecting && (
              <button
                onClick={cancelSelecting}
                className="px-1 py-2 text-primary text-base font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {isSelecting && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-card/40 border border-border/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{selectedCodes.size} selected</p>
              <div className="flex items-center gap-3">
                <button onClick={selectAll} className="text-sm font-bold text-primary">Select all</button>
              </div>
            </div>
          </div>
        )}

        {shareFeedback && (
          <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{shareFeedback}</p>
          </div>
        )}

        <div className="space-y-2 pb-4">
          {filteredStickers.map((sticker) => (
            isSelecting ? (
              <SelectableTeamStickerCard
                key={sticker.code}
                sticker={sticker}
                selected={selectedCodes.has(sticker.code)}
                onToggle={toggleCode}
              />
            ) : (
              <StickerCard
                key={sticker.code}
                {...sticker}
                onClick={() => onStickerClick(sticker.code)}
                onStatusChange={(newStatus) => handleStatusChange(sticker.code, newStatus)}
                onDuplicateCountChange={(newCount) => handleDuplicateCountChange(sticker.code, newCount)}
                onDelete={() => handleDelete(sticker.code)}
              />
            )
          ))}
        </div>
      </div>

      {isSelecting && (
        <div className="fixed left-1/2 bottom-0 z-[70] w-full max-w-md -translate-x-1/2 pointer-events-none">
          <div className="pointer-events-auto bg-background-secondary/95 backdrop-blur-xl border-t border-x border-border/70 shadow-2xl p-3 pb-4 sm:rounded-t-2xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-semibold text-muted-foreground">{selectedCodes.size} selected</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={selectedCodes.size === 0}
                onClick={() => setPendingAction('owned')}
                className="h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Mark owned
              </button>
              {filter === 'missing' ? (
                <button
                  disabled={selectedCodes.size === 0}
                  onClick={() => setPendingAction('duplicate')}
                  className="h-10 rounded-xl bg-card/50 border border-border/50 text-foreground text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
                >
                  Mark duplicate
                </button>
              ) : (
                <button
                  disabled={selectedCodes.size === 0}
                  onClick={() => setPendingAction('missing')}
                  className="h-10 rounded-xl bg-card/50 border border-border/50 text-foreground text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
                >
                  Mark missing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[80] px-4 sm:pb-6" onClick={() => setPendingAction(null)}>
          <div
            className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 border border-border/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-5" />
            <h2 className="text-xl font-bold text-foreground mb-2">Update {selectedCodes.size} stickers?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {pendingAction === 'duplicate'
                ? 'This will mark the selected stickers as owned and add one duplicate to each.'
                : pendingAction === 'owned'
                  ? 'This will remove missing or duplicate status and keep these stickers as owned.'
                  : 'This will remove owned and duplicate counts, then move these stickers back to missing.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={confirmBulkAction}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="w-full h-12 rounded-xl bg-card/40 border border-border/50 text-foreground font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
