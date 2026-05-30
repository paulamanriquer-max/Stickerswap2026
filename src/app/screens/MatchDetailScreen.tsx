import { useState } from 'react';
import { StickerCard } from '../components/StickerCard';
import { DistanceBadge } from '../components/DistanceBadge';
import { MatchScoreBadge } from '../components/MatchScoreBadge';
import { SegmentedControl } from '../components/SegmentedControl';
import { CollectorComparison } from '../lib/backend';
import { getPlayerByCode } from '../data/players';
import { ChevronLeft, MessageCircle } from 'lucide-react';

interface MatchDetailScreenProps {
  comparison?: CollectorComparison;
  onBack: () => void;
  onStartChat: () => void;
}

type DetailTab = 'matches' | 'you-need' | 'they-need';
type ReadOnlyStatus = 'available' | 'missing';

const toStickerCard = (code: string, status: ReadOnlyStatus) => {
  const player = getPlayerByCode(code);
  return {
    code,
    playerName: player?.name || 'Sticker',
    owned: status === 'available',
    missing: status === 'missing',
    duplicateCount: status === 'available' ? 1 : 0,
  };
};

const EmptySection = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-border/50 bg-card/30 p-4 text-center">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
  </div>
);

const StickerSection = ({
  title,
  codes,
  status,
  description,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  codes: string[];
  status: ReadOnlyStatus;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}) => (
  <div>
    <h3 className="mb-2">{title} ({codes.length})</h3>
    <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    {codes.length === 0 ? (
      <EmptySection title={emptyTitle} description={emptyDescription} />
    ) : (
      <div className="space-y-2">
        {codes.map((code) => (
          <StickerCard
            key={code}
            {...toStickerCard(code, status)}
            readOnly={true}
          />
        ))}
      </div>
    )}
  </div>
);

export function MatchDetailScreen({ comparison, onBack, onStartChat }: MatchDetailScreenProps) {
  const [filter, setFilter] = useState<DetailTab>('matches');

  if (!comparison) {
    return (
      <div className="min-h-screen bg-background px-4 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
        <EmptySection
          title="Collector not found"
          description="This collector may no longer be available in the Kansas City market."
        />
      </div>
    );
  }

  const renderSection = (section: DetailTab) => {
    if (section === 'matches') {
      return (
        <StickerSection
          title="Matches"
          codes={comparison.matches}
          status="available"
          description={`${comparison.username} has these stickers available from your missing list.`}
          emptyTitle="No matches yet"
          emptyDescription="This collector does not currently have stickers from your missing list."
        />
      );
    }

    if (section === 'you-need') {
      return (
        <StickerSection
          title="You need"
          codes={comparison.youNeed}
          status="missing"
          description="Your full missing list, even if this collector does not have those stickers available."
          emptyTitle="Your missing list is empty"
          emptyDescription="Mark stickers as missing to compare your needs with collectors."
        />
      );
    }

    if (section === 'they-need') {
      return (
        <StickerSection
          title="They need"
          codes={comparison.theyNeed}
          status="missing"
          description={`${comparison.username}'s full missing list, even if you do not have duplicates for those stickers.`}
          emptyTitle="No missing stickers from this collector yet"
          emptyDescription="When this collector tracks missing stickers, their needs will appear here."
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-bold text-xl">
              {comparison.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground mb-1 truncate">{comparison.username}</h1>
            <div className="flex items-center gap-2">
              <DistanceBadge distance={comparison.distance} />
              <MatchScoreBadge score={comparison.matchScore} />
            </div>
          </div>
        </div>

        <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50 shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{comparison.matches.length}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Matches</span>
            </div>
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{comparison.theyNeed.length}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">They Need</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <SegmentedControl
            options={[
              { value: 'matches', label: 'Matches' },
              { value: 'you-need', label: 'You Need' },
              { value: 'they-need', label: 'They Need' },
            ]}
            value={filter}
            onChange={(value) => setFilter(value as DetailTab)}
          />
        </div>
      </div>

      <div className="px-4 space-y-6">
        {renderSection(filter)}
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-background-secondary/95 backdrop-blur-xl border-t border-x border-border p-4 safe-area-bottom shadow-2xl sm:rounded-t-2xl">
        <button
          onClick={onStartChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Start Chat</span>
        </button>
      </div>
    </div>
  );
}
