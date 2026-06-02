import { CollectorCard } from '../components/CollectorCard';
import { EmptyState } from '../components/EmptyState';
import { SearchBar } from '../components/SearchBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { backend, CollectorComparison, StickerState } from '../lib/backend';
import { showDeviceNotification } from '../lib/notificationFeedback';

interface MatchesScreenProps {
  onCollectorClick: (collectorId: string) => void;
  city: string;
  stickers: StickerState[];
}

type CollectorView = 'matches' | 'all';
const NOTIFIED_MATCHES_KEY = 'stickerswap.notifiedMatchIds';

const loadNotifiedMatchIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_MATCHES_KEY) || '[]') as string[]);
  } catch {
    return new Set<string>();
  }
};

const saveNotifiedMatchIds = (ids: Set<string>) => {
  localStorage.setItem(NOTIFIED_MATCHES_KEY, JSON.stringify([...ids]));
};

const notifyNewMatches = (collectors: CollectorComparison[]) => {
  const preferences = backend.loadNotificationPreferences();
  if (!preferences.pushEnabled || !preferences.matches) return;

  const notifiedIds = loadNotifiedMatchIds();
  const currentMatchIds = new Set(
    collectors
      .filter(collector => collector.matches.length > 0)
      .map(collector => `${collector.id}:${collector.matches.join(',')}`)
  );

  if (notifiedIds.size === 0) {
    saveNotifiedMatchIds(currentMatchIds);
    return;
  }

  const newMatches = collectors.filter(collector => {
    if (collector.matches.length === 0) return false;
    return !notifiedIds.has(`${collector.id}:${collector.matches.join(',')}`);
  });

  if (newMatches.length === 0) {
    saveNotifiedMatchIds(currentMatchIds);
    return;
  }

  const firstMatch = newMatches[0];
  const extraCount = newMatches.length - 1;
  showDeviceNotification(
    'New StickerSwap match',
    `${firstMatch.username} has ${firstMatch.matches.length} sticker${firstMatch.matches.length === 1 ? '' : 's'} you need${extraCount > 0 ? `, plus ${extraCount} more collector${extraCount === 1 ? '' : 's'}` : ''}.`
  );
  saveNotifiedMatchIds(currentMatchIds);
};

export function MatchesScreen({ onCollectorClick, city, stickers }: MatchesScreenProps) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<CollectorView>('matches');
  const [collectors, setCollectors] = useState<CollectorComparison[]>(() => backend.getCollectorComparisons(stickers));

  useEffect(() => {
    let isMounted = true;
    setCollectors(backend.getCollectorComparisons(stickers));
    void backend.saveStickers(stickers)
      .catch(() => {})
      .then(() => backend.refreshCollectorComparisons())
      .then(nextCollectors => {
        if (!isMounted) return;
        setCollectors(nextCollectors);
        notifyNewMatches(nextCollectors);
      })
      .catch(() => {
        if (isMounted) setCollectors(backend.getCollectorComparisons(stickers));
      });
    return () => {
      isMounted = false;
    };
  }, [stickers]);

  const trueMatches = collectors.filter(collector => collector.matches.length > 0);
  const visibleCollectors = view === 'matches' ? trueMatches : collectors;
  const filteredCollectors = visibleCollectors.filter(c =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );
  const emptyTitle = view === 'matches' ? 'No sticker matches yet' : 'No collectors found';
  const emptyDescription = view === 'matches'
    ? 'No collector currently has duplicates from your missing list. Switch to All collectors to browse everyone who has joined.'
    : 'No other Kansas City collectors have joined yet. New testers will appear here after they create accounts.';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Collectors</h1>
          <p className="text-sm text-muted-foreground">Browse Kansas City collectors and trade matches</p>
        </div>
      </div>

      <div className="px-4">
        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search collectors..."
          />
        </div>

        <div className="mb-4">
          <SegmentedControl
            options={[
              { value: 'matches', label: `Matches (${trueMatches.length})` },
              { value: 'all', label: `All collectors (${collectors.length})` },
            ]}
            value={view}
            onChange={(value) => setView(value as CollectorView)}
          />
        </div>

        {filteredCollectors.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-16 h-16" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3>
                {view === 'matches'
                  ? `${filteredCollectors.length} sticker match${filteredCollectors.length === 1 ? '' : 'es'}`
                  : `${filteredCollectors.length} collectors in Kansas City`}
              </h3>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-full">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">
                  {city}
                </span>
              </div>
            </div>

            <div className="space-y-2 pb-4">
              {filteredCollectors.map((collector) => (
                <CollectorCard
                  key={collector.id}
                  username={collector.username}
                  matchScore={collector.matchScore}
                  matchesCount={collector.matches.length}
                  theyNeedCount={collector.theyNeed.length}
                  onClick={() => onCollectorClick(collector.id)}
                  city={city}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
