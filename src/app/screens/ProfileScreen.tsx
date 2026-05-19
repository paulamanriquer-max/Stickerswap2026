import { ChevronRight, MapPin, Bell, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { AppUser } from '../lib/backend';

interface Sticker {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
}

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
  stickers?: Sticker[];
  user?: AppUser | null;
}

export function ProfileScreen({ onNavigate, stickers = [], user }: ProfileScreenProps) {
  const menuItems = [
    { icon: UserIcon, label: user?.email ? 'Edit Profile' : 'Add Email Backup', screen: user?.email ? 'edit-profile' : 'add-email' },
    { icon: MapPin, label: 'Location Settings', screen: 'location-settings' },
    { icon: Bell, label: 'Notifications', screen: 'notifications' },
    { icon: Shield, label: 'Privacy & Security', screen: 'privacy-security' },
  ];

  // Calculate trading stats from actual data
  const totalTrades = stickers.filter(s => s.owned || s.duplicateCount > 0).length;
  const ownedStickers = stickers.filter(s => s.owned).length;
  const totalDuplicates = stickers.reduce((sum, s) => sum + s.duplicateCount, 0);
  const completionPercentage = stickers.length > 0
    ? Math.round((ownedStickers / stickers.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings</p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg mb-6">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-bold text-base">{(user?.username || 'C').charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">{user?.username || 'Collector'}</h3>
            <p className="text-xs text-muted-foreground">
              {user?.email ? 'Email saved for backup and chat' : 'Anonymous collection, email optional'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3">Trading Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{totalTrades}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Trades</span>
            </div>
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{completionPercentage}%</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Complete</span>
            </div>
            <div className="flex flex-col items-center justify-center px-3 py-2 bg-card/50 backdrop-blur-xl rounded-lg border border-border/50 shadow-lg">
              <span className="text-xl font-bold text-foreground">{totalDuplicates}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Dupes</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3">Settings</h3>
          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg overflow-hidden">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.screen)}
                className={`w-full flex items-center gap-3 p-3 active:bg-accent transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('sign-in')}
          className="w-full flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
