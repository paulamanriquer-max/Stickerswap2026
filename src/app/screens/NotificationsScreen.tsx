import { ArrowLeft, Bell, Zap, Users, Award } from 'lucide-react';
import { useState } from 'react';
import { Toggle } from '../components/Toggle';

interface NotificationsScreenProps {
  onBack?: () => void;
}

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchNotifs, setMatchNotifs] = useState(true);
  const [tradeNotifs, setTradeNotifs] = useState(true);
  const [milestoneNotifs, setMilestoneNotifs] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Push Notifications</h3>
                  <p className="text-xs text-muted-foreground">Receive notifications on this device</p>
                </div>
              </div>
              <Toggle enabled={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
            </div>
          </div>

          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">New Matches</h3>
                  <p className="text-xs text-muted-foreground">When nearby collectors appear</p>
                </div>
              </div>
              <Toggle enabled={matchNotifs} onChange={() => setMatchNotifs(!matchNotifs)} />
            </div>

            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Trade Updates</h3>
                  <p className="text-xs text-muted-foreground">Messages and trade offers</p>
                </div>
              </div>
              <Toggle enabled={tradeNotifs} onChange={() => setTradeNotifs(!tradeNotifs)} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Milestones</h3>
                  <p className="text-xs text-muted-foreground">Collection achievements</p>
                </div>
              </div>
              <Toggle enabled={milestoneNotifs} onChange={() => setMilestoneNotifs(!milestoneNotifs)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
