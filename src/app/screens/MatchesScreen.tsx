import { CollectorCard } from '../components/CollectorCard';
import { EmptyState } from '../components/EmptyState';
import { SearchBar } from '../components/SearchBar';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { backend, CollectorComparison, StickerState } from '../lib/backend';

interface MatchesScreenProps {
  onCollectorClick: (collectorId: string) => void;
  city: string;
  stickers: StickerState[];
}

export function MatchesScreen({ onCollectorClick, city, stickers }: MatchesScreenProps) {
  const [search, setSearch] = useState('');
  const [collectors, setCollectors] = useState<CollectorComparison[]>(() => backend.getCollectorComparisons(stickers));

  useEffect(() => {
    let isMounted = true;
    setCollectors(backend.getCollectorComparisons(stickers));
    void backend.refreshCollectorComparisons()
      .then(nextCollectors => {
        if (isMounted) setCollectors(nextCollectors);
      })
      .catch(() => {
        if (isMounted) setCollectors(backend.getCollectorComparisons(stickers));
      });
    return () => {
      isMounted = false;
    };
  }, [stickers]);

  const filteredCollectors = collectors.filter(c =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Matches</h1>
          <p className="text-sm text-muted-foreground">Kansas City collectors sorted by best match</p>
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

        {filteredCollectors.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-16 h-16" />}
            title="No collectors found"
            description="No other Kansas City collectors have joined yet. New testers will appear here after they create accounts."
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3>{filteredCollectors.length} collectors in Kansas City</h3>
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
                  theyHaveYouNeed={collector.theyHaveYouNeed}
                  youHaveTheyNeed={collector.youHaveTheyNeed}
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
