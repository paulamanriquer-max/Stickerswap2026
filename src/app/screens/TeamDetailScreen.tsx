import { StickerCard } from '../components/StickerCard';
import { SearchBar } from '../components/SearchBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { ChevronLeft, Award, Users } from 'lucide-react';
import { useState } from 'react';
import { getTeamByCode } from '../data/teams';
import { getPlayersByTeam } from '../data/players';
import { getTeamColors } from '../data/teamColors';

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

export function TeamDetailScreen({ teamCode, onBack, onStickerClick, stickers, onUpdateSticker, onDeleteSticker }: TeamDetailScreenProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const team = getTeamByCode(teamCode);
  const teamPlayers = getPlayersByTeam(teamCode);
  const colors = getTeamColors(teamCode);

  const allTeamStickers = teamPlayers.map((player) => {
    const existingSticker = stickers.find(s => s.code === player.code || s.code.replace(/\s+/g, '') === player.stickerNumber);

    return {
      code: player.code,
      owned: existingSticker?.owned || false,
      missing: existingSticker?.missing || false,
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
        owned: newStatus === 'owned',
        missing: newStatus === 'missing',
        duplicateCount: newStatus === 'duplicate' ? 1 : 0,
      };
      onUpdateSticker(code, newSticker);
    } else {
      // Update existing sticker
      if (newStatus === 'owned') {
        onUpdateSticker(code, { owned: true, missing: false });
      } else if (newStatus === 'missing') {
        onUpdateSticker(code, { missing: true, owned: false, duplicateCount: 0 });
      } else if (newStatus === 'duplicate') {
        onUpdateSticker(code, { duplicateCount: Math.max(1, existingSticker.duplicateCount), missing: false });
      }
    }
  };

  const handleDuplicateCountChange = (code: string, newCount: number) => {
    onUpdateSticker(code, { duplicateCount: newCount });
  };

  const handleDelete = (code: string) => {
    onDeleteSticker(code);
  };

  const filteredStickers = displayStickers.filter(s => {
    // Filter by status
    if (filter === 'missing' && !s.missing) return false;
    if (filter === 'duplicate' && s.duplicateCount === 0) return false;

    // Filter by search
    if (search && !s.code.toLowerCase().includes(search.toLowerCase()) &&
        !s.playerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    owned: displayStickers.filter(s => s.owned).length,
    missing: displayStickers.filter(s => s.missing).length,
    duplicates: displayStickers.filter(s => s.duplicateCount > 0).length,
  };

  const totalStickers = team.total || 20;
  const completionPercent = displayStickers.length > 0
    ? Math.round((stats.owned / totalStickers) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
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
              { value: 'missing', label: 'Missing' },
              { value: 'duplicate', label: 'Duplicates' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="mb-2">
          <h3>
            {filter === 'all' && `All Stickers (${filteredStickers.length})`}
            {filter === 'missing' && `Missing (${filteredStickers.length})`}
            {filter === 'duplicate' && `Duplicates (${filteredStickers.length})`}
          </h3>
        </div>

        <div className="space-y-2 pb-4">
          {filteredStickers.map((sticker) => (
            <StickerCard
              key={sticker.code}
              {...sticker}
              onClick={() => onStickerClick(sticker.code)}
              onStatusChange={(newStatus) => handleStatusChange(sticker.code, newStatus)}
              onDuplicateCountChange={(newCount) => handleDuplicateCountChange(sticker.code, newCount)}
              onDelete={() => handleDelete(sticker.code)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
