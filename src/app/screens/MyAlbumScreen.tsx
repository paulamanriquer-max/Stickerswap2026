import { TeamCard } from '../components/TeamCard';
import { SearchBar } from '../components/SearchBar';
import { StickerCard } from '../components/StickerCard';
import { Plus, Award, ArrowLeft, Copy, CheckCircle, AlertCircle, Check, Loader2 } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { worldCupTeams } from '../data/teams';
import { getPlayerByCode, getPlayersByTeam } from '../data/players';
import { StickerStatus } from '../lib/stickerState';

interface Sticker {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
}

interface MyAlbumScreenProps {
  onTeamClick: (teamCode: string) => void;
  onAddSticker: () => void;
  stickers: Sticker[];
  onBulkUpdate: (codes: string[], status: StickerStatus) => void;
  onUpdateSticker: (code: string, updates: Partial<Sticker>) => void;
}

type Subpage = 'owned' | 'missing' | 'duplicates' | null;
type BulkAction = 'owned' | 'duplicate' | 'missing';
const PAGE_SIZE = 60;

const SelectableStickerCard = memo(function SelectableStickerCard({
  sticker,
  selected,
  onToggle,
}: {
  sticker: Sticker;
  selected: boolean;
  onToggle: (code: string) => void;
}) {
  const playerName = getPlayerByCode(sticker.code)?.name || 'Sticker';
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <button
      type="button"
      key={sticker.code}
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
        <span className="block text-xs text-muted-foreground truncate">{playerName}</span>
      </span>
      {sticker.duplicateCount > 0 && (
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
          x{sticker.duplicateCount}
        </span>
      )}
    </button>
  );
});

function StickerGroup({
  teamCode,
  stickers,
  selectable,
  selectedCodes,
  onToggle,
  onStatusChange,
  onDuplicateCountChange,
  onDelete,
}: {
  teamCode: string;
  stickers: Sticker[];
  selectable: boolean;
  selectedCodes: Set<string>;
  onToggle: (code: string) => void;
  onStatusChange?: (code: string, status: StickerStatus) => void;
  onDuplicateCountChange?: (code: string, count: number) => void;
  onDelete?: (code: string) => void;
}) {
  const team = worldCupTeams.find(t => t.code === teamCode);
  if (!team || stickers.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{team.flag}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{team.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">{stickers.length}</span>
      </div>
      <div className="space-y-2">
        {stickers.map(s => (
          selectable ? (
            <SelectableStickerCard
              key={s.code}
              sticker={s}
              selected={selectedCodes.has(s.code)}
              onToggle={onToggle}
            />
          ) : (
            <StickerCard
              key={s.code}
              {...s}
              playerName={getPlayerByCode(s.code)?.name || 'Sticker'}
              onStatusChange={(status) => onStatusChange?.(s.code, status)}
              onDuplicateCountChange={(count) => onDuplicateCountChange?.(s.code, count)}
              onDelete={() => onDelete?.(s.code)}
            />
          )
        ))}
      </div>
    </div>
  );
}

function getStickerSectionCode(code: string) {
  return getPlayerByCode(code)?.teamCode || code.split(' ')[0];
}

function SubpageView({
  title,
  icon,
  stickers,
  subpage,
  onBack,
  onBulkUpdate,
  onUpdateSticker,
}: {
  title: string;
  icon: React.ReactNode;
  stickers: Sticker[];
  subpage: Subpage;
  onBack: () => void;
  onBulkUpdate: (codes: string[], status: StickerStatus) => void;
  onUpdateSticker: (code: string, updates: Partial<Sticker>) => void;
}) {
  const [search, setSearch] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return stickers.filter(s =>
      s.code.toLowerCase().includes(query) ||
      (getPlayerByCode(s.code)?.name || '').toLowerCase().includes(query)
    );
  }, [search, stickers]);

  const visibleStickers = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const visibleTeamCodes = useMemo(
    () => worldCupTeams
      .map(team => team.code)
      .filter(code => visibleStickers.some(sticker => getStickerSectionCode(sticker.code) === code)),
    [visibleStickers]
  );
  const bulkEnabled = subpage === 'missing' || subpage === 'duplicates';
  const selectedCount = selectedCodes.size;
  const actionLabel = pendingAction === 'owned'
    ? 'mark as owned'
    : pendingAction === 'duplicate'
      ? 'mark as duplicates'
      : 'mark as missing';
  const actionDescription = pendingAction === 'duplicate'
    ? 'This will mark the selected stickers as owned and add one duplicate to each.'
    : pendingAction === 'owned'
      ? 'This will remove missing or duplicate status and keep these stickers as owned.'
      : 'This will remove owned and duplicate counts, then move these stickers back to missing.';

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, subpage, stickers.length]);

  useEffect(() => {
    const marker = loadMoreRef.current;
    if (!marker || visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(count => Math.min(count + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const toggleCode = useCallback((code: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const startSelecting = () => {
    setIsSelecting(true);
    setSelectedCodes(new Set());
  };

  const cancelSelecting = () => {
    setIsSelecting(false);
    setSelectedCodes(new Set());
    setPendingAction(null);
  };

  const selectAll = () => {
    setSelectedCodes(new Set(filtered.map(sticker => sticker.code)));
  };

  const confirmBulkAction = () => {
    if (!pendingAction || selectedCodes.size === 0) return;
    onBulkUpdate(Array.from(selectedCodes), pendingAction);
    cancelSelecting();
  };

  const handleStatusChange = (code: string, status: StickerStatus) => {
    const current = stickers.find(sticker => sticker.code === code);
    if (status === 'owned') {
      onUpdateSticker(code, { owned: true, missing: false, duplicateCount: 0 });
    } else if (status === 'missing') {
      onUpdateSticker(code, { owned: false, missing: true, duplicateCount: 0 });
    } else {
      onUpdateSticker(code, { owned: true, missing: false, duplicateCount: Math.max(1, current?.duplicateCount || 1) });
    }
  };

  const handleDuplicateCountChange = (code: string, count: number) => {
    onUpdateSticker(code, { owned: count > 0, missing: false, duplicateCount: count });
  };

  return (
    <div className={`min-h-screen bg-background ${isSelecting ? 'pb-40' : 'pb-20'}`}>
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">My Album</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">{stickers.length} sticker{stickers.length !== 1 ? 's' : ''}</p>
          </div>
          {bulkEnabled && !isSelecting && stickers.length > 0 && (
            <button
              onClick={startSelecting}
              className="px-1 py-2 text-primary text-base font-bold active:scale-95 transition-all"
            >
              Select
            </button>
          )}
          {bulkEnabled && isSelecting && (
            <button
              onClick={cancelSelecting}
              className="px-1 py-2 text-primary text-base font-bold active:scale-95 transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {bulkEnabled && isSelecting && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-card/40 border border-border/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{selectedCount} selected</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="text-sm font-bold text-primary"
                >
                  Select all
                </button>
              </div>
            </div>
          </div>
        )}

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Search ${title.toLowerCase()}...`}
        />
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-3 text-muted-foreground">
              {subpage === 'duplicates' ? <Copy className="w-10 h-10" /> : subpage === 'owned' ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
            </span>
            <p className="text-muted-foreground text-sm">
              {search ? 'No stickers match your search' : `No ${title.toLowerCase()} yet`}
            </p>
          </div>
        ) : (
          visibleTeamCodes.map(code => (
            <StickerGroup
              key={code}
              teamCode={code}
              stickers={visibleStickers.filter(s => getStickerSectionCode(s.code) === code)}
              selectable={isSelecting}
              selectedCodes={selectedCodes}
              onToggle={toggleCode}
              onStatusChange={handleStatusChange}
              onDuplicateCountChange={handleDuplicateCountChange}
              onDelete={(code) => onUpdateSticker(code, { owned: false, missing: true, duplicateCount: 0 })}
            />
          ))
        )}
        {visibleCount < filtered.length && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/40">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {bulkEnabled && isSelecting && (
        <div className="fixed left-1/2 bottom-0 z-[70] w-full max-w-md -translate-x-1/2 pointer-events-none">
          <div className="pointer-events-auto bg-background-secondary/95 backdrop-blur-xl border-t border-x border-border/70 shadow-2xl p-3 pb-4 sm:rounded-t-2xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {selectedCount} selected
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={selectedCount === 0}
                onClick={() => setPendingAction('owned')}
                className="h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Mark owned
              </button>
              <button
                disabled={selectedCount === 0}
                onClick={() => setPendingAction(subpage === 'duplicates' ? 'missing' : 'duplicate')}
                className="h-10 rounded-xl bg-card/50 border border-border/50 text-foreground text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
              >
                {subpage === 'duplicates' ? 'Mark missing' : 'Mark duplicate'}
              </button>
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
            <h2 className="text-xl font-bold text-foreground mb-2">Update {selectedCount} stickers?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This will {actionLabel}. {actionDescription}
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

export function MyAlbumScreen({ onTeamClick, onAddSticker, stickers, onBulkUpdate, onUpdateSticker }: MyAlbumScreenProps) {
  const [search, setSearch] = useState('');
  const [activeSubpage, setActiveSubpage] = useState<Subpage>(null);

  const teamsWithStats = worldCupTeams.map(team => {
    const sectionStickerCodes = new Set(getPlayersByTeam(team.code).map(player => player.code));
    const teamStickers = stickers.filter(s => sectionStickerCodes.has(s.code));
    const owned = teamStickers.filter(s => s.owned || s.duplicateCount > 0).length;
    const missing = teamStickers.filter(s => s.missing).length;
    const duplicates = teamStickers.filter(s => s.duplicateCount > 0).reduce((sum, s) => sum + s.duplicateCount, 0);
    return { ...team, owned, missing, duplicates };
  });

  const stats = {
    collected: stickers.filter(s => s.owned || s.duplicateCount > 0).length,
    owned: stickers.filter(s => s.owned).length,
    missing: stickers.filter(s => s.missing).length,
    duplicates: stickers.reduce((sum, s) => sum + s.duplicateCount, 0),
    total: worldCupTeams.reduce((sum, t) => sum + t.total, 0),
  };

  const completionPercent = stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0;

  const filteredTeams = teamsWithStats.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.code.toLowerCase().includes(search.toLowerCase())
  );

  const ownedStickers = stickers.filter(s => s.owned);
  const missingStickers = stickers.filter(s => s.missing);
  const duplicateStickers = stickers.filter(s => s.duplicateCount > 0);

  if (activeSubpage === 'owned') {
    return (
      <SubpageView
        title="Owned"
        icon={<CheckCircle className="w-5 h-5 text-primary" />}
        stickers={ownedStickers}
        subpage="owned"
        onBack={() => setActiveSubpage(null)}
        onBulkUpdate={onBulkUpdate}
        onUpdateSticker={onUpdateSticker}
      />
    );
  }

  if (activeSubpage === 'missing') {
    return (
      <SubpageView
        title="Missing"
        icon={<AlertCircle className="w-5 h-5 text-primary" />}
        stickers={missingStickers}
        subpage="missing"
        onBack={() => setActiveSubpage(null)}
        onBulkUpdate={onBulkUpdate}
        onUpdateSticker={onUpdateSticker}
      />
    );
  }

  if (activeSubpage === 'duplicates') {
    return (
      <SubpageView
        title="Duplicates"
        icon={<Copy className="w-5 h-5 text-primary" />}
        stickers={duplicateStickers}
        subpage="duplicates"
        onBack={() => setActiveSubpage(null)}
        onBulkUpdate={onBulkUpdate}
        onUpdateSticker={onUpdateSticker}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">My Album</h1>
              <p className="text-sm text-muted-foreground">FIFA World Cup 2026</p>
            </div>
          </div>
          <button
            onClick={onAddSticker}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg active:scale-95 transition-all font-bold text-xs shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sticker</span>
          </button>
        </div>

        {/* Progress Card */}
        <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50 shadow-lg mb-4">
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
            <button
              onClick={() => setActiveSubpage('owned')}
              className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg active:scale-95 transition-all hover:border-primary/50"
            >
              <span className="text-xl font-bold text-foreground">{stats.owned}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Owned</span>
            </button>
            <button
              onClick={() => setActiveSubpage('missing')}
              className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg active:scale-95 transition-all hover:border-primary/50"
            >
              <span className="text-xl font-bold text-foreground">{stats.missing}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Missing</span>
            </button>
            <button
              onClick={() => setActiveSubpage('duplicates')}
              className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg active:scale-95 transition-all hover:border-primary/50"
            >
              <span className="text-xl font-bold text-foreground">{stats.duplicates}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Dupes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search categories..."
          />
        </div>

        <div className="mb-2">
          <h3>Album Categories ({filteredTeams.length})</h3>
        </div>

        <div className="space-y-2 pb-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.code}
              {...team}
              onClick={() => onTeamClick(team.code)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
