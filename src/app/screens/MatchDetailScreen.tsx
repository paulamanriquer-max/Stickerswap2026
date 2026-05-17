import { Button } from '../components/Button';
import { StickerCard } from '../components/StickerCard';
import { DistanceBadge } from '../components/DistanceBadge';
import { MatchScoreBadge } from '../components/MatchScoreBadge';
import { SegmentedControl } from '../components/SegmentedControl';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface MatchDetailScreenProps {
  username: string;
  onBack: () => void;
  onStartChat: () => void;
}

export function MatchDetailScreen({ username, onBack, onStartChat }: MatchDetailScreenProps) {
  const [filter, setFilter] = useState('all');

  const [youNeedFromThem, setYouNeedFromThem] = useState([
    { code: 'POR 3', playerName: 'Rúben Dias', status: 'missing' as 'owned' | 'missing' | 'duplicate', duplicateCount: 1 },
    { code: 'ARG 10', playerName: 'Lionel Messi', status: 'missing' as 'owned' | 'missing' | 'duplicate', duplicateCount: 1 },
    { code: 'BRA 10', playerName: 'Neymar Jr.', status: 'missing' as 'owned' | 'missing' | 'duplicate', duplicateCount: 1 },
  ]);

  const [theyNeedFromYou, setTheyNeedFromYou] = useState([
    { code: 'CAN 9', playerName: 'Cyle Larin', status: 'duplicate' as 'owned' | 'missing' | 'duplicate', duplicateCount: 2 },
    { code: 'FRA 7', playerName: 'Antoine Griezmann', status: 'duplicate' as 'owned' | 'missing' | 'duplicate', duplicateCount: 3 },
  ]);

  const handleStatusChangeYouNeed = (code: string, newStatus: 'owned' | 'missing' | 'duplicate') => {
    setYouNeedFromThem(prevStickers =>
      prevStickers.map(sticker =>
        sticker.code === code ? { ...sticker, status: newStatus } : sticker
      )
    );
  };

  const handleStatusChangeTheyNeed = (code: string, newStatus: 'owned' | 'missing' | 'duplicate') => {
    setTheyNeedFromYou(prevStickers =>
      prevStickers.map(sticker =>
        sticker.code === code ? { ...sticker, status: newStatus } : sticker
      )
    );
  };

  const handleDuplicateCountChangeYouNeed = (code: string, newCount: number) => {
    setYouNeedFromThem(prevStickers =>
      prevStickers.map(sticker =>
        sticker.code === code ? { ...sticker, duplicateCount: newCount } : sticker
      )
    );
  };

  const handleDuplicateCountChangeTheyNeed = (code: string, newCount: number) => {
    setTheyNeedFromYou(prevStickers =>
      prevStickers.map(sticker =>
        sticker.code === code ? { ...sticker, duplicateCount: newCount } : sticker
      )
    );
  };

  const handleDeleteYouNeed = (code: string) => {
    setYouNeedFromThem(prevStickers => prevStickers.filter(sticker => sticker.code !== code));
  };

  const handleDeleteTheyNeed = (code: string) => {
    setTheyNeedFromYou(prevStickers => prevStickers.filter(sticker => sticker.code !== code));
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
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">{username}</h1>
            <div className="flex items-center gap-2">
              <DistanceBadge distance="0.4 mi" />
              <MatchScoreBadge score={95} />
            </div>
          </div>
        </div>

        <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50 shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{youNeedFromThem.length}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">You Need</span>
            </div>
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{theyNeedFromYou.length}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">They Need</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <SegmentedControl
            options={[
              { value: 'all', label: 'All' },
              { value: 'you-need', label: 'You Need' },
              { value: 'they-need', label: 'They Need' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
      </div>

      <div className="px-4 space-y-6">
        {(filter === 'all' || filter === 'you-need') && (
          <div>
            <h3 className="mb-2">They have, you need ({youNeedFromThem.length})</h3>
            <div className="space-y-2">
              {youNeedFromThem.map((sticker) => (
                <StickerCard
                  key={sticker.code}
                  {...sticker}
                  readOnly={true}
                />
              ))}
            </div>
          </div>
        )}

        {(filter === 'all' || filter === 'they-need') && (
          <div>
            <h3 className="mb-2">You have, they need ({theyNeedFromYou.length})</h3>
            <div className="space-y-2 pb-4">
              {theyNeedFromYou.map((sticker) => (
                <StickerCard
                  key={sticker.code}
                  {...sticker}
                  onStatusChange={(newStatus) => handleStatusChangeTheyNeed(sticker.code, newStatus)}
                  onDuplicateCountChange={(newCount) => handleDuplicateCountChangeTheyNeed(sticker.code, newCount)}
                  onDelete={() => handleDeleteTheyNeed(sticker.code)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background-secondary/95 backdrop-blur-xl border-t border-border p-4 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={onStartChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Start Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
