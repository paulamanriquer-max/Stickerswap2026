interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

export function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 rounded-full transition-transform ${
          enabled ? 'translate-x-6 bg-[#0a1929]' : 'translate-x-1 bg-white'
        }`}
      />
    </button>
  );
}
