import { ChevronLeft, Send } from 'lucide-react';
import type { CSSProperties } from 'react';
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
  errorMessage?: string;
  onBack: () => void;
  onSendMessage: (text: string) => void;
  onUpgradeRequest?: () => void;
}

export function ChatScreen({ username, messages = [], isPublic = false, canSend = true, errorMessage = '', onBack, onSendMessage, onUpgradeRequest }: ChatScreenProps) {
  const [message, setMessage] = useState('');
  const [viewportStyle, setViewportStyle] = useState<CSSProperties>({ height: '100dvh' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const updateViewport = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) {
        setViewportStyle({ height: '100dvh', top: 0 });
        return;
      }
      setViewportStyle({
        height: `${visualViewport.height}px`,
        top: `${visualViewport.offsetTop}px`,
      });
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

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
    <div
      className="fixed inset-x-0 z-[100] bg-background flex flex-col overflow-hidden md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2"
      style={viewportStyle}
    >
      <div className="shrink-0 px-4 pt-5 pb-3 bg-background-secondary/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <span className="text-primary-foreground font-bold text-sm">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold text-foreground">{username}</h2>
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
              className={`flex items-end gap-2 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {isPublic && !msg.isOwn && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card/50 backdrop-blur-xl border border-border/50 text-foreground rounded-bl-sm'
                }`}
              >
                {isPublic && (
                  <p className={`mb-1 text-[11px] font-bold leading-none ${
                    msg.isOwn ? 'text-primary-foreground/80' : 'text-primary'
                  }`}>
                    {msg.isOwn ? 'You' : msg.sender}
                  </p>
                )}
                <p className="break-words text-sm leading-5">{msg.text}</p>
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

      {errorMessage && (
        <div className="shrink-0 px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs font-semibold text-destructive">{errorMessage}</p>
        </div>
      )}

      <div className="shrink-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background-secondary/95 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center gap-2">
          <textarea
            value={message}
            rows={1}
            style={{ fontSize: 17, lineHeight: '22px' }}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            disabled={!canSend}
            className="min-w-0 flex-1 h-11 max-h-11 resize-none overflow-hidden px-4 py-[10px] bg-card/50 backdrop-blur-xl rounded-full border border-border/50 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
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
