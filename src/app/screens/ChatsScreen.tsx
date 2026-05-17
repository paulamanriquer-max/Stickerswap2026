import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  username: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

interface ChatsScreenProps {
  conversations: Conversation[];
  onChatClick: (username: string) => void;
  city: string;
}

type ChatView = 'public' | 'private';

export function ChatsScreen({ conversations, onChatClick, city }: ChatsScreenProps) {
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

  const sortedConversations = [...conversations].sort((a, b) => {
    const timeA = a.lastMessageTime?.getTime() || 0;
    const timeB = b.lastMessageTime?.getTime() || 0;
    return timeB - timeA;
  });

  const publicRooms = [
    { name: `${city} - Meetups & Trades`, memberCount: 127 },
    { name: `${city} - General Chat`, memberCount: 89 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Chats</h1>
          <p className="text-sm text-muted-foreground mb-4">Public rooms and private conversations</p>

          {/* Segment Filter */}
          <div className="flex gap-1 p-1 bg-card/30 rounded-xl border border-border/50">
            <button
              onClick={() => setView('public')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'public'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Public Rooms
            </button>
            <button
              onClick={() => setView('private')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'private'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Private Chats
            </button>
          </div>
        </div>

        {/* Public Rooms Section */}
        {view === 'public' && (
          <div className="space-y-2">
            {publicRooms.map((room) => (
              <button
                key={room.name}
                onClick={() => onChatClick(room.name)}
                className="w-full flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-semibold text-foreground text-sm">{room.name}</h3>
                  <p className="text-xs text-muted-foreground">{room.memberCount} members</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Private Chats Section */}
        {view === 'private' && (
          <div>
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
                  <button
                    key={conversation.username}
                    onClick={() => onChatClick(conversation.username)}
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
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(conversation.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
