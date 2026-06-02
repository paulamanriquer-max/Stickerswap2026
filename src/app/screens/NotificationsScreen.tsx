import { ArrowLeft, Bell, MessageCircle, Users, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Toggle } from '../components/Toggle';
import { backend, NotificationPreferences } from '../lib/backend';

interface NotificationsScreenProps {
  onBack?: () => void;
}

type NotificationPermissionState = NotificationPermission | 'unsupported';

const getDevicePermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

const permissionLabel = (permission: NotificationPermissionState, isFilePreview: boolean) => {
  if (permission === 'granted') return 'Alerts, sound, and vibration are enabled on this device';
  if (permission === 'denied') return 'Notifications are blocked in browser settings';
  if (permission === 'unsupported') return 'Notifications are not supported in this preview';
  if (isFilePreview) return 'Device permission works in the hosted test build';
  return 'Turn on to allow notifications on this device';
};

function ChannelRow({
  icon,
  title,
  description,
  enabled,
  disabled,
  onChange,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onChange: () => void;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 ${isLast ? '' : 'border-b border-border/50'}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <div>
          <h3 className={`font-semibold ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled && !disabled} disabled={disabled} onChange={onChange} />
    </div>
  );
}

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => backend.loadNotificationPreferences());
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getDevicePermission());
  const [statusMessage, setStatusMessage] = useState('');

  const isFilePreview = useMemo(() => typeof window !== 'undefined' && window.location.protocol === 'file:', []);
  const canRequestPermission = permission !== 'unsupported' && permission !== 'denied';
  const pushEnabled = preferences.pushEnabled && permission === 'granted';
  const channelsDisabled = !pushEnabled;

  const savePreferences = (next: NotificationPreferences) => {
    setPreferences(next);
    backend.saveNotificationPreferences(next);
  };

  const updatePreference = (key: keyof Pick<NotificationPreferences, 'matches' | 'messages' | 'tradeRequests'>) => {
    savePreferences({ ...preferences, [key]: !preferences[key], permission });
  };

  const handlePushToggle = async () => {
    if (pushEnabled) {
      const next = { ...preferences, pushEnabled: false, permission };
      savePreferences(next);
      setStatusMessage('Notifications are off for this device.');
      return;
    }

    if (!canRequestPermission) {
      setStatusMessage(permissionLabel(permission, isFilePreview));
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);

    if (nextPermission === 'granted') {
      const next = { ...preferences, pushEnabled: true, permission: nextPermission };
      savePreferences(next);
      backend.track('notifications_enabled', { permission: nextPermission });
      setStatusMessage('Notifications are on for this device. New messages can show an alert, sound, or vibration when supported.');

      try {
        new Notification('StickerSwap notifications are on', {
          body: 'New messages can alert, vibrate, or play a soft sound when supported.',
        });
      } catch {
        // Some preview environments allow permission but block creating the test notification.
      }
      return;
    }

    const next = { ...preferences, pushEnabled: false, permission: nextPermission };
    savePreferences(next);
    backend.track('notifications_blocked', { permission: nextPermission });
    setStatusMessage(permissionLabel(nextPermission, isFilePreview));
  };

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
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Bell className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">Push Notifications</h3>
                  <p className="text-xs text-muted-foreground">{permissionLabel(permission, isFilePreview)}</p>
                </div>
              </div>
              <Toggle enabled={pushEnabled} disabled={permission === 'unsupported' || permission === 'denied'} onChange={handlePushToggle} />
            </div>
            {statusMessage && (
              <p className="mt-3 text-xs text-muted-foreground">{statusMessage}</p>
            )}
          </div>

          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden">
            <ChannelRow
              icon={<Zap className="w-5 h-5 text-primary flex-shrink-0" />}
              title="New Matches"
              description="When nearby collectors match your missing stickers"
              enabled={preferences.matches}
              disabled={channelsDisabled}
              onChange={() => updatePreference('matches')}
            />

            <ChannelRow
              icon={<MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />}
              title="Messages"
              description="Public and private messages, with unread badges"
              enabled={preferences.messages}
              disabled={channelsDisabled}
              onChange={() => updatePreference('messages')}
            />

            <ChannelRow
              icon={<Users className="w-5 h-5 text-primary flex-shrink-0" />}
              title="Trade Requests"
              description="When a collector wants to trade"
              enabled={preferences.tradeRequests}
              disabled={channelsDisabled}
              onChange={() => updatePreference('tradeRequests')}
              isLast={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
