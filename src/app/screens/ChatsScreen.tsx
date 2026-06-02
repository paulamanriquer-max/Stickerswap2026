import { useEffect, useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { SegmentedControl } from '../components/SegmentedControl';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  userId?: string;
  username: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

interface ChatsScreenProps {
  conversations: Conversation[];
  publicMessages: Message[];
  publicRoomName: string;
  publicUnreadCount?: number;
  privateUnreadByUser?: Record<string, number>;
  onChatClick: (username: string, userId?: string) => void;
  onUpgradeRequest: () => void;
  onPublicVisible?: () => void;
  canUsePrivateChat: boolean;
  city: string;
}

type ChatView = 'public' | 'private';

export function ChatsScreen({
  conversations,
  publicMessages,
  publicRoomName,
  publicUnreadCount = 0,
  privateUnreadByUser = {},
  onChatClick,
  onUpgradeRequest,
  onPublicVisible,
  canUsePrivateChat,
  city,
}: ChatsScreenProps) {
  const [view, setView] = useState<ChatView>('public');
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sortedConversations = conversations
    .filter(conversation => conversation.username !== publicRoomName)
    .sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });

  const latestPublicMessage = publicMessages[publicMessages.length - 1];

  useEffect(() => {
    if (view !== 'public') return;
    onPublicVisible?.();
  }, [view, latestPublicMessage?.id, publicMessages.length, onPublicVisible]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Chats</h1>
          <p className="text-sm text-muted-foreground mb-4">Community chat and private conversations</p>

          <SegmentedControl
            options={[
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
            ]}
            value={view}
            onChange={(value) => setView(value as ChatView)}
          />
        </div>

        {/* Public Chat Section */}
        {view === 'public' && (
          <div className="space-y-2">
            <button
              onClick={() => onChatClick(publicRoomName)}
              className="w-full flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm">{publicRoomName}</h3>
                  {publicUnreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {publicUnreadCount > 9 ? '9+' : publicUnreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {publicMessages.length === 0
                    ? 'No public messages yet'
                    : `${publicMessages.length} message${publicMessages.length === 1 ? '' : 's'}`}
                </p>
                {latestPublicMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {latestPublicMessage.sender}: {latestPublicMessage.text}
                  </p>
                )}
              </div>
            </button>

            {publicMessages.length === 0 && (
              <div className="rounded-xl border border-border/50 bg-card/30 p-4 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-bold text-foreground">Start the Kansas City collector chat</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Share what you need, what you have to trade, or where you want to meet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Private Chats Section */}
        {view === 'private' && (
          <div>
            {!canUsePrivateChat && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <h3 className="text-sm font-bold text-foreground">Add your email to chat and trade with others</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  You can browse collectors now. Private messages unlock after magic-link email setup.
                </p>
                <button
                  onClick={onUpgradeRequest}
                  className="mt-3 h-10 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground active:scale-95"
                >
                  Add email
                </button>
              </div>
            )}
            {sortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  No private chats yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedConversations.map((conversation) => (
                  (() => {
                    const unreadCount = privateUnreadByUser[conversation.userId || conversation.username] || 0;
                    return (
                  <button
                    key={conversation.username}
                    onClick={() => onChatClick(conversation.username, conversation.userId)}
                    className="w-full flex items-center gap-3 p-3 bg-card/30 backdrop-blur-xl hover:bg-card/40 rounded-xl border border-border/50 shadow-lg active:scale-[0.98] transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
                      <span className="text-primary-foreground font-bold text-base">
                        {conversation.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{conversation.username}</h3>
                        <div className="flex items-center gap-2">
                          {conversation.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(conversation.lastMessageTime)}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
