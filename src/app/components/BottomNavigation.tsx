import { User, Zap, BookOpen, MessageCircle } from 'lucide-react';

type Tab = 'album' | 'matches' | 'chats' | 'profile';

interface BottomNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'album' as Tab, label: 'Album', icon: BookOpen },
    { id: 'matches' as Tab, label: 'Matches', icon: Zap },
    { id: 'chats' as Tab, label: 'Chats', icon: MessageCircle },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-background-secondary/95 backdrop-blur-xl border-t border-x border-border safe-area-bottom shadow-2xl sm:rounded-t-2xl">
      <div className="grid grid-cols-4 gap-1 px-2 h-16 items-center">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`relative w-full h-12 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              activeTab === id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === id && (
              <div className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/30" />
            )}
            <Icon className={`relative w-5 h-5 transition-all ${
              activeTab === id ? 'scale-110' : 'scale-100'
            }`} />
            <span className={`relative text-[9px] transition-all ${
              activeTab === id ? 'font-bold' : 'font-medium'
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
