import { CollectorCard } from '../components/CollectorCard';
import { EmptyState } from '../components/EmptyState';
import { SearchBar } from '../components/SearchBar';
import { MapPin, Zap } from 'lucide-react';
import { useState } from 'react';

interface MatchesScreenProps {
  onCollectorClick: (username: string) => void;
  locationEnabled: boolean;
  city: string;
}

export function MatchesScreen({ onCollectorClick, locationEnabled, city }: MatchesScreenProps) {
  const [search, setSearch] = useState('');

  const collectors = [
    {
      username: 'Carlos',
      distance: '0.4 mi',
      matchScore: 95,
      theyHaveYouNeed: 8,
      youHaveTheyNeed: 6,
    },
    {
      username: 'Ana',
      distance: '0.8 mi',
      matchScore: 88,
      theyHaveYouNeed: 5,
      youHaveTheyNeed: 7,
    },
    {
      username: 'Mateo',
      distance: '1.2 mi',
      matchScore: 76,
      theyHaveYouNeed: 4,
      youHaveTheyNeed: 3,
    },
    {
      username: 'Sofia',
      distance: '2.5 mi',
      matchScore: 65,
      theyHaveYouNeed: 3,
      youHaveTheyNeed: 4,
    },
  ];

  const filteredCollectors = collectors.filter(c =>
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">Matches</h1>
          <p className="text-sm text-muted-foreground">Nearby collectors sorted by best match</p>
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
            description="Try adjusting your search or check back later for new matches nearby"
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3>{filteredCollectors.length} collectors nearby</h3>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-full">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">
                  {locationEnabled ? '3 mi' : city}
                </span>
              </div>
            </div>

            <div className="space-y-2 pb-4">
              {filteredCollectors.map((collector) => (
                <CollectorCard
                  key={collector.username}
                  {...collector}
                  onClick={() => onCollectorClick(collector.username)}
                  locationEnabled={locationEnabled}
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
