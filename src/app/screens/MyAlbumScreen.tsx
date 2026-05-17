import { TeamCard } from '../components/TeamCard';
import { SearchBar } from '../components/SearchBar';
import { Plus, Award, ArrowLeft, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { worldCupTeams } from '../data/teams';
import { getPlayerByCode, getPlayersByTeam } from '../data/players';

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
}

type Subpage = 'owned' | 'missing' | 'duplicates' | null;

function StickerGroup({ teamCode, stickers }: { teamCode: string; stickers: Sticker[] }) {
  const team = worldCupTeams.find(t => t.code === teamCode);
  if (!team || stickers.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{team.flag}</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{team.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">{stickers.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {stickers.map(s => (
          <div
            key={s.code}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card/40 border border-border/50 rounded-lg"
          >
            <span className="text-xs font-bold text-foreground">{s.code}</span>
            {s.duplicateCount > 1 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                x{s.duplicateCount}
              </span>
            )}
          </div>
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
}: {
  title: string;
  icon: React.ReactNode;
  stickers: Sticker[];
  subpage: Subpage;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = stickers.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const teamCodes = worldCupTeams
    .map(team => team.code)
    .filter(code => filtered.some(sticker => getStickerSectionCode(sticker.code) === code));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">My Album</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-xs text-muted-foreground">{stickers.length} sticker{stickers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

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
          teamCodes.map(code => (
            <StickerGroup
              key={code}
              teamCode={code}
              stickers={filtered.filter(s => getStickerSectionCode(s.code) === code)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function MyAlbumScreen({ onTeamClick, onAddSticker, stickers }: MyAlbumScreenProps) {
  const [search, setSearch] = useState('');
  const [activeSubpage, setActiveSubpage] = useState<Subpage>(null);

  const teamsWithStats = worldCupTeams.map(team => {
    const sectionStickerCodes = new Set(getPlayersByTeam(team.code).map(player => player.code));
    const teamStickers = stickers.filter(s => sectionStickerCodes.has(s.code));
    const owned = teamStickers.filter(s => s.owned).length;
    const missing = teamStickers.filter(s => s.missing).length;
    const duplicates = teamStickers.filter(s => s.duplicateCount > 0).reduce((sum, s) => sum + s.duplicateCount, 0);
    return { ...team, owned, missing, duplicates };
  });

  const stats = {
    owned: stickers.filter(s => s.owned).length,
    missing: stickers.filter(s => s.missing).length,
    duplicates: stickers.reduce((sum, s) => sum + s.duplicateCount, 0),
    total: worldCupTeams.reduce((sum, t) => sum + t.total, 0),
  };

  const completionPercent = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;

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
