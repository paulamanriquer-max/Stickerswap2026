import { useEffect, useState } from 'react';
import {
  Users, AlertTriangle, BarChart2, Search, LogOut,
  ShieldCheck, CheckCircle, XCircle, Clock, ChevronDown,
  Trash2, Ban, UserCheck, ArrowLeft, TrendingUp, MessageSquare,
} from 'lucide-react';
import { AdminChatMessage, AdminUserSummary, backend } from '../lib/backend';

type UserStatus = AdminUserSummary['status'];

type IssueSeverity = 'low' | 'medium' | 'high';
type IssueStatus = 'open' | 'in-progress' | 'resolved';

interface Issue {
  id: string;
  user: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  createdAt: string;
}

const initialIssues: Issue[] = [];

type ChatMessage = AdminChatMessage;
const initialChatMessages: ChatMessage[] = [];

const loadAdminChatMessages = (): ChatMessage[] =>
  backend.loadPublicMessages().map(message => ({
    id: message.id,
    user: message.sender,
    room: 'Public Chat',
    city: 'Kansas City',
    message: message.text,
    timestamp: new Date(message.timestamp).toLocaleString(),
    flagged: false,
  }));

// ── Sub-components ────────────────────────────────────────────────────────────

type AdminTab = 'dashboard' | 'users' | 'issues' | 'chats';

const statusColors: Record<UserStatus, string> = {
  active:    'text-success bg-success/10 border-success/20',
  suspended: 'text-warning bg-warning/10 border-warning/20',
  banned:    'text-destructive bg-destructive/10 border-destructive/20',
};

const severityColors: Record<IssueSeverity, string> = {
  low:    'text-info bg-info/10 border-info/20',
  medium: 'text-warning bg-warning/10 border-warning/20',
  high:   'text-destructive bg-destructive/10 border-destructive/20',
};

const issueStatusColors: Record<IssueStatus, string> = {
  open:        'text-destructive bg-destructive/10 border-destructive/20',
  'in-progress': 'text-warning bg-warning/10 border-warning/20',
  resolved:    'text-success bg-success/10 border-success/20',
};

function SignupChart({ data, days }: { data: { date: string; signups: number }[]; days: number }) {
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const max = Math.max(1, ...data.map(d => d.signups));

  const showLabel = (i: number, total: number) => {
    if (total <= 7) return true;
    return i === 0 || i === total - 1 || i % Math.ceil(total / 5) === 0;
  };

  // Use line chart for 30 days, bar chart for shorter periods
  if (days > 14) {
    const width = 100;
    const height = 100;
    const padding = { top: 5, right: 5, bottom: 15, left: 5 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.signups / max) * chartHeight;
      return { x, y, value: d.signups, date: d.date, index: i };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="h-32 relative">
        <svg viewBox="0 0 300 100" className="w-full h-full">
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          {points.map((p) => (
            <circle
              key={`point-${p.index}`}
              cx={p.x}
              cy={p.y}
              r={tooltip?.index === p.index ? 4 : 2.5}
              fill="var(--primary)"
              className="cursor-pointer transition-all"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ index: p.index, x: rect.left, y: rect.top });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
          {data.map((d, i) => {
            if (!showLabel(i, data.length)) return null;
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={height - 2}
                textAnchor="middle"
                fontSize="4"
                className="fill-muted-foreground"
              >
                {d.date.replace('May ', '').replace('Apr ', '')}
              </text>
            );
          })}
        </svg>
        {tooltip !== null && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-primary/30 rounded-md px-2 py-1 text-[10px] font-semibold text-primary whitespace-nowrap z-10 shadow-lg pointer-events-none">
            {data[tooltip.index].signups}
          </div>
        )}
      </div>
    );
  }

  // Bar chart for shorter periods (3d, 7d, 14d)
  return (
    <div className="flex items-end gap-[3px] h-32">
      {data.map((d, i) => {
        const heightPct = max > 0 ? (d.signups / max) * 100 : 0;
        const isHovered = tooltip?.index === i;
        return (
          <div
            key={`bar-${i}-${d.date}`}
            className="flex-1 flex flex-col items-center justify-end h-full relative group"
            onMouseEnter={() => setTooltip({ index: i, x: 0, y: 0 })}
            onMouseLeave={() => setTooltip(null)}
          >
            {isHovered && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-primary/30 rounded-md px-2 py-1 text-[10px] font-semibold text-primary whitespace-nowrap z-10 shadow-lg">
                {d.signups}
              </div>
            )}
            <div
              className="w-full rounded-t-sm transition-all duration-150 cursor-default"
              style={{
                height: `${heightPct}%`,
                minHeight: 2,
                background: isHovered
                  ? 'var(--primary)'
                  : 'color-mix(in srgb, var(--primary) 55%, transparent)',
              }}
            />
            <span className={`text-[8px] text-muted-foreground w-full text-center leading-none pt-1 transition-opacity ${showLabel(i, data.length) ? 'opacity-100' : 'opacity-0'}`}>
              {d.date.replace('May ', '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const CHART_RANGES = [
  { label: '3d',  days: 3 },
  { label: '7d',  days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
] as const;

function SignupChartCard({ users }: { users: AdminUserSummary[] }) {
  const [days, setDays] = useState(14);
  const today = new Date();
  const data = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const isoDate = date.toISOString().slice(0, 10);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      signups: users.filter(user => user.joinedAt === isoDate).length,
    };
  });
  const total = data.reduce((s, d) => s + d.signups, 0);

  return (
    <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Signups</p>
        <div className="flex gap-1">
          {CHART_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                days === r.days
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'text-muted-foreground border-border/50 hover:border-primary/20 hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mb-4">{total} <span className="text-sm font-normal text-muted-foreground">total</span></p>
      <SignupChart data={data} days={days} />
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Dashboard({ users }: { users: AdminUserSummary[] }) {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalTrades = users.reduce((s, u) => s + u.trades, 0);
  const openIssues = initialIssues.filter(i => i.status === 'open').length;
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const newThisWeek = users.filter(user => new Date(user.joinedAt) >= weekAgo).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users"    value={totalUsers}  sub={`${activeUsers} active`}    icon={<Users className="w-4 h-4" />} />
        <StatCard label="New This Week"  value={newThisWeek} sub="last 7 days"                icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Trades Made"    value={totalTrades} sub="all time"                   icon={<MessageSquare className="w-4 h-4" />} />
        <StatCard label="Open Issues"    value={openIssues}  sub="need attention"             icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {users.length > 0 ? <SignupChartCard users={users} /> : (
        <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50">
          <p className="text-sm font-semibold text-foreground">No accounts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Created accounts will appear here for testing.</p>
        </div>
      )}

      <div className="bg-card/30 backdrop-blur-xl rounded-xl p-4 border border-border/50">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Recent Signups</p>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No user accounts have been created yet.</p>
        ) : (
          <div className="space-y-3">
            {[...users].reverse().slice(0, 5).map(u => (
            <div key={u.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.location} · {u.joinedAt}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[u.status]}`}>
                {u.status}
              </span>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab({
  users,
  setUsers,
  onDeleteUser,
  deletingUserId,
}: {
  users: AdminUserSummary[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUserSummary[]>>;
  onDeleteUser: (id: string) => void;
  deletingUserId: string | null;
}) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase())
  );

  const setStatus = (id: string, status: UserStatus) =>
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      backend.updateAccountStatus(u.email, status);
      return { ...u, status };
    }));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full h-12 pl-8 pr-4 bg-card/30 rounded-xl border border-border/50 outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="bg-card/30 rounded-xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {u.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.location} · {u.stickers} stickers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[u.status]}`}>
                  {u.status}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === u.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedId === u.id && (
              <div className="border-t border-border/50 px-3 py-3 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-foreground">{u.stickers}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stickers</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{u.trades}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trades</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{u.joinedAt}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Joined</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">Last active: {u.lastActive}</p>
                <div className="flex gap-2">
                  {u.status !== 'active' && (
                    <button
                      onClick={() => setStatus(u.id, 'active')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-success/40 text-success text-xs font-semibold active:scale-95 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Activate
                    </button>
                  )}
                  {u.status !== 'suspended' && (
                    <button
                      onClick={() => setStatus(u.id, 'suspended')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-warning/40 text-warning text-xs font-semibold active:scale-95 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                  {u.status !== 'banned' && (
                    <button
                      onClick={() => setStatus(u.id, 'banned')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold active:scale-95 transition-all"
                    >
                      <Ban className="w-3.5 h-3.5" /> Ban
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteUser(u.id)}
                    disabled={deletingUserId === u.id}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-destructive/40 text-destructive active:scale-95 transition-all disabled:opacity-50"
                    aria-label={deletingUserId === u.id ? 'Removing user' : 'Remove user'}
                  >
                    {deletingUserId === u.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IssuesTab({ issues, setIssues }: { issues: Issue[]; setIssues: React.Dispatch<React.SetStateAction<Issue[]>> }) {
  const [filter, setFilter] = useState<IssueStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = issues.filter(i => filter === 'all' || i.status === filter);

  const setStatus = (id: string, status: IssueStatus) =>
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));

  const counts = {
    all: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    'in-progress': issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  const filters: { key: IssueStatus | 'all'; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'open', label: `Open (${counts.open})` },
    { key: 'in-progress', label: `In Progress (${counts['in-progress']})` },
    { key: 'resolved', label: `Resolved (${counts.resolved})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/50 text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card/30 rounded-xl border border-border/50 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No issues reported</p>
            <p className="text-xs text-muted-foreground mt-1">User reports will appear here when they are submitted.</p>
          </div>
        ) : filtered.map(issue => (
          <div key={issue.id} className="bg-card/30 rounded-xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
              className="w-full flex items-start justify-between p-3 text-left gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{issue.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{issue.user} · {issue.createdAt}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColors[issue.severity]}`}>
                  {issue.severity}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === issue.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {expandedId === issue.id && (
              <div className="border-t border-border/50 px-3 py-3 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${issueStatusColors[issue.status]}`}>
                    {issue.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {issue.status !== 'in-progress' && issue.status !== 'resolved' && (
                    <button
                      onClick={() => setStatus(issue.id, 'in-progress')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-warning/40 text-warning text-xs font-semibold active:scale-95 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" /> In Progress
                    </button>
                  )}
                  {issue.status !== 'resolved' && (
                    <button
                      onClick={() => setStatus(issue.id, 'resolved')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-success/40 text-success text-xs font-semibold active:scale-95 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                  {issue.status === 'resolved' && (
                    <button
                      onClick={() => setStatus(issue.id, 'open')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border/50 text-muted-foreground text-xs font-semibold active:scale-95 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reopen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatsModTab({
  messages,
  setMessages,
  onDeleteMessage,
  deletingMessageId,
}: {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onDeleteMessage: (id: string) => void;
  deletingMessageId: string | null;
}) {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cities = ['all', ...Array.from(new Set(messages.map(m => m.city)))];
  const filtered = messages.filter(m => selectedCity === 'all' || m.city === selectedCity);
  const flaggedCount = messages.filter(m => m.flagged).length;

  const toggleFlag = (id: string) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, flagged: !m.flagged } : m));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {cities.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedCity === city
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/50 text-muted-foreground'
            }`}
          >
            {city === 'all' ? 'All Cities' : city}
          </button>
        ))}
      </div>

      {flaggedCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
          <p className="text-sm font-semibold text-destructive">{flaggedCount} flagged message{flaggedCount !== 1 ? 's' : ''} need attention</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} message{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-card/30 rounded-xl border border-border/50 p-6 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No public messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Messages from testers will appear here for moderation.</p>
          </div>
        ) : filtered.map(msg => (
          <div key={msg.id} className={`rounded-xl border overflow-hidden ${msg.flagged ? 'bg-destructive/5 border-destructive/30' : 'bg-card/30 border-border/50'}`}>
            <button
              onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
              className="w-full flex items-start justify-between p-3 text-left gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">{msg.user}</p>
                  {msg.flagged && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/30">
                      Flagged
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{msg.city} · {msg.room} · {msg.timestamp}</p>
                <p className="text-sm text-foreground">{msg.message}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === msg.id ? 'rotate-180' : ''}`} />
            </button>

            {expandedId === msg.id && (
              <div className="border-t border-border/50 px-3 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFlag(msg.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border text-xs font-semibold active:scale-95 transition-all ${
                      msg.flagged
                        ? 'border-success/40 text-success'
                        : 'border-warning/40 text-warning'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> {msg.flagged ? 'Unflag' : 'Flag'}
                  </button>
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    disabled={deletingMessageId === msg.id}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {deletingMessageId === msg.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface AdminScreenProps {
  onLogout: () => void;
}

export function AdminScreen({ onLogout }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [users, setUsers] = useState<AdminUserSummary[]>(() => backend.getAdminUsers());
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const messages = loadAdminChatMessages();
    return messages.length > 0 ? messages : initialChatMessages;
  });
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(true);
  const [adminDataError, setAdminDataError] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const refreshAdminReport = () => {
    setIsLoadingLiveData(true);
    setAdminDataError('');

    return backend.getAdminReport()
      .then(report => {
        setUsers(report.users);
        setChatMessages(report.publicMessages);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        setAdminDataError(`Live admin data is not connected yet. ${message || 'Run the Supabase admin report setup before launch.'}`);
      })
      .finally(() => setIsLoadingLiveData(false));
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingLiveData(true);
    setAdminDataError('');

    backend.getAdminReport()
      .then(report => {
        if (!isMounted) return;
        setUsers(report.users);
        setChatMessages(report.publicMessages);
      })
      .catch((error) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : '';
        setAdminDataError(`Live admin data is not connected yet. ${message || 'Run the Supabase admin report setup before launch.'}`);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLiveData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const deletePublicMessage = (id: string) => {
    if (deletingMessageId) return;
    setDeletingMessageId(id);
    backend.adminDeletePublicMessage(id)
      .then(() => refreshAdminReport())
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        setAdminDataError(`Could not delete that message from the live app. ${message || 'Try again.'}`);
      })
      .finally(() => setDeletingMessageId(null));
  };

  const deleteAdminUser = (id: string) => {
    if (deletingUserId) return;
    const user = users.find(candidate => candidate.id === id);
    setDeletingUserId(id);
    backend.adminDeleteUser(id, user?.email)
      .then(() => refreshAdminReport())
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        setAdminDataError(`Could not remove that user from the live app. ${message || 'Try again.'}`);
      })
      .finally(() => setDeletingUserId(null));
  };

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'users',     label: 'Users',     icon: <Users className="w-4 h-4" /> },
    { key: 'issues',    label: 'Issues',    icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'chats',     label: 'Chats',     icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sticker Swap</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground text-xs font-medium active:scale-95 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {isLoadingLiveData && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-sm font-semibold text-foreground">Loading live admin data...</p>
            <p className="mt-1 text-xs text-muted-foreground">Pulling users, sticker counts, and public chat from Supabase.</p>
          </div>
        )}

        {adminDataError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm font-semibold text-destructive">Admin data needs setup</p>
            <p className="mt-1 text-xs text-muted-foreground">{adminDataError}</p>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard users={users} />}
        {activeTab === 'users'     && (
          <UsersTab
            users={users}
            setUsers={setUsers}
            onDeleteUser={deleteAdminUser}
            deletingUserId={deletingUserId}
          />
        )}
        {activeTab === 'issues'    && <IssuesTab issues={issues} setIssues={setIssues} />}
        {activeTab === 'chats'     && (
          <ChatsModTab
            messages={chatMessages}
            setMessages={setChatMessages}
            onDeleteMessage={deletePublicMessage}
            deletingMessageId={deletingMessageId}
          />
        )}
      </div>

      {/* Bottom navigation — mirrors BottomNavigation component pattern */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 bg-background-secondary/95 backdrop-blur-xl border-t border-x border-border shadow-2xl sm:rounded-t-2xl">
        <div className="grid grid-cols-4 gap-1 px-2 h-16 items-center">
          {tabs.map(t => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative w-full h-12 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/30" />
                )}
                <span className={`relative transition-all ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {t.icon}
                </span>
                <span className={`relative text-[9px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
