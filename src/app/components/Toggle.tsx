interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ enabled, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div
        className={`absolute top-1 w-5 h-5 rounded-full transition-transform ${
          enabled ? 'translate-x-6 bg-[#0a1929]' : 'translate-x-1 bg-white'
        }`}
      />
    </button>
  );
}
