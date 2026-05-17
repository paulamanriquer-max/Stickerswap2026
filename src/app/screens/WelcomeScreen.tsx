import svgPaths from "@/imports/IPhone161/svg-goga8cul8s";
import { MapPin } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onLogIn: () => void;
}

function LogoText() {
  return (
    <div className="absolute inset-[64.29%_8.12%_10.43%_11.18%]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 251.784 78.887">
        <g>
          <path d={svgPaths.pf3e6d00} fill="white" />
          <path d={svgPaths.p5794770} fill="white" />
          <path d={svgPaths.p3e12c780} fill="white" />
          <path d={svgPaths.p3455d280} fill="white" />
          <path d={svgPaths.p3bed2e00} fill="white" />
          <path d={svgPaths.pb62400} fill="white" />
          <path d={svgPaths.p353f1bd0} fill="white" />
          <path d={svgPaths.p17a4e400} fill="white" />
          <path d={svgPaths.p31458f80} fill="white" />
          <path d={svgPaths.p36e34300} fill="white" />
          <path d={svgPaths.p2f4ae700} fill="white" />
        </g>
      </svg>
    </div>
  );
}

function LogoNumeral() {
  return (
    <div className="absolute inset-[19.39%_17.34%_45.5%_16.5%]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 206.413 109.544">
        <g>
          <path clipRule="evenodd" d={svgPaths.p2d31c880} fill="white" fillRule="evenodd" />
          <path d={svgPaths.pd1b7680} fill="white" />
        </g>
      </svg>
    </div>
  );
}

function LogoBall() {
  return (
    <div className="absolute inset-[6.12%_40.11%_74.66%_38.78%]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 65.8629 59.9645">
        <ellipse cx="32.9314" cy="29.9823" fill="#FFCB05" rx="32.9314" ry="29.9823" />
        <path d={svgPaths.pacb1f0} fill="#FAA61A" />
      </svg>
    </div>
  );
}

function LogoCup() {
  return (
    <div className="absolute inset-[16.66%_40.05%_42.01%_38.97%]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 65.4661 128.96">
        <path d={svgPaths.p409a900} fill="#FFDD00" />
        <mask id="cup-mask" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }} width="66" height="129" x="0" y="0">
          <path d={svgPaths.p409a900} fill="#FFDD00" />
        </mask>
        <g mask="url(#cup-mask)">
          <path d={svgPaths.p18ecf8c0} fill="#FDB913" />
          <rect fill="#00DDFF" height="13.7268" width="54.7534" x="5.75313" y="101.867" />
        </g>
      </svg>
    </div>
  );
}

export function WelcomeScreen({ onCreateAccount, onLogIn }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#090f1e" }}>
      {/* Scrollable content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 overflow-y-auto pb-32">
        <div className="relative rounded-lg overflow-hidden" style={{ width: 280, height: 280, backgroundColor: "#090f1f" }}>
          <LogoText />
          <LogoNumeral />
          <LogoBall />
          <LogoCup />
        </div>

        {/* Tagline */}
        <p
          className="text-center text-white mt-8 tracking-[2.56px] text-[16px] leading-[24px] max-w-[245px]"
          style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          CONNECTING 2026 COLLECTORS TO TRADE PANINI STICKERS
        </p>

        {/* Kansas City Badge */}
        <div className="flex items-center gap-1 px-2 pr-3 py-1 rounded-full mt-4" style={{ backgroundColor: "#fff838" }}>
          <MapPin className="w-4 h-4" style={{ color: "#1E1E1E" }} />
          <span className="text-[16px] font-medium" style={{ color: "#090f1e", fontFamily: "var(--font-body)" }}>
            Kansas City
          </span>
        </div>
      </div>

      {/* Sticky Buttons */}
      <div className="fixed bottom-0 left-0 right-0 w-full px-5 py-6" style={{ backgroundColor: "#090f1e" }}>
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <button
            onClick={onCreateAccount}
            className="w-full rounded-xl py-[10px] px-4 text-[18px] font-medium text-center active:scale-95 transition-all"
            style={{ backgroundColor: "#00ddff", color: "#090f1e", fontFamily: "var(--font-body)" }}
          >
            Create account
          </button>

          <button
            onClick={onLogIn}
            className="w-full rounded-xl py-[10px] px-4 text-[18px] font-medium text-center border border-[#00ddff] text-[#00ddff] active:scale-95 transition-all"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
