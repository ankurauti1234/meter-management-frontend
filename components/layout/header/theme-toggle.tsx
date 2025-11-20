/* eslint-disable react-hooks/set-state-in-effect */
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="theme-toggle-wrapper border bg-muted shadow-sm size-8 rounded-lg flex items-center justify-center cursor-pointer">
      <label 
        htmlFor="themeToggle" 
        className="themeToggle st-sunMoonThemeToggleBtn" 
        // type="checkbox"
      >
        <input 
          type="checkbox" 
          id="themeToggle" 
          className="themeToggleInput"
          checked={isDark}
          onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
        />
        <svg 
          width={18} 
          height={18} 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          stroke="none"
        >
          <mask id="moon-mask">
            <rect x={0} y={0} width={20} height={20} fill="white" />
            <circle cx={11} cy={3} r={8} fill="black" />
          </mask>
          <circle className="sunMoon" cx={10} cy={10} r={8} mask="url(#moon-mask)" />
          <g>
            <circle className="sunRay sunRay1" cx={18} cy={10} r="1.5" />
            <circle className="sunRay sunRay2" cx={14} cy="16.928" r="1.5" />
            <circle className="sunRay sunRay3" cx={6} cy="16.928" r="1.5" />
            <circle className="sunRay sunRay4" cx={2} cy={10} r="1.5" />
            <circle className="sunRay sunRay5" cx={6} cy="3.1718" r="1.5" />
            <circle className="sunRay sunRay6" cx={14} cy="3.1718" r="1.5" />
          </g>
        </svg>
      </label>
    </div>
  );
}