import { ChevronLeft, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatScreenProps {
  username: string;
  messages: Message[];
  isPublic?: boolean;
  canSend?: boolean;
  onBack: () => void;
  onSendMessage: (text: string) => void;
  onUpgradeRequest?: () => void;
}

export function ChatScreen({ username, messages = [], isPublic = false, canSend = true, onBack, onSendMessage, onUpgradeRequest }: ChatScreenProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!canSend) {
      onUpgradeRequest?.();
      return;
    }
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-background flex flex-col overflow-hidden">
      <div className="sticky top-0 z-20 shrink-0 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <span className="text-primary-foreground font-bold text-sm">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{username}</h2>
            <p className="text-xs text-muted-foreground">{isPublic ? 'Public room' : 'Online'}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">{canSend ? 'No messages yet. Start the conversation!' : 'Add your email to send private messages.'}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card/50 backdrop-blur-xl border border-border/50 text-foreground rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {!canSend && (
        <div className="shrink-0 px-4 py-3 bg-primary/10 border-t border-primary/20">
          <button
            onClick={onUpgradeRequest}
            className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-95"
          >
            Add email to chat and trade with others
          </button>
        </div>
      )}

      <div className="sticky bottom-0 z-20 shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background-secondary/95 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            disabled={!canSend}
            className="flex-1 h-11 px-4 bg-card/50 backdrop-blur-xl rounded-full border border-border/50 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground text-sm"
          />
          <button
            onClick={handleSend}
            disabled={canSend && !message.trim()}
            className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
