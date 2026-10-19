import React, { useState } from 'react';
import { Sun, Moon, Menu, X, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header({ health, checkingHealth, onRefreshHealth }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHealthy = health?.status === 'healthy';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo mark */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            🍲
          </div>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Nutri<span style={{ color: 'var(--accent-lime)', filter: isDark ? 'none' : 'brightness(0.65) saturate(1.3)' }}>Lens</span>
            </h1>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '0.01em',
              }}
              className="hidden-mobile"
            >
              AI Food Recognition
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Backend Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              border: `1px solid ${isHealthy ? 'var(--nutrition-protein-border)' : 'var(--nutrition-calories-border)'}`,
              backgroundColor: isHealthy ? 'var(--nutrition-protein-bg)' : 'var(--nutrition-calories-bg)',
              color: isHealthy ? 'var(--nutrition-protein)' : 'var(--nutrition-calories)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isHealthy ? 'var(--status-success)' : 'var(--status-error)',
                display: 'inline-block',
                animation: isHealthy ? 'pulse-ring 2s ease-in-out infinite' : 'none',
              }}
            />
            <span className="hidden-mobile">
              {checkingHealth ? 'Checking...' : isHealthy ? 'API Connected' : 'API Offline'}
            </span>
            <span className="show-mobile-only">
              {isHealthy ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Refresh Health */}
          <button
            onClick={onRefreshHealth}
            disabled={checkingHealth}
            aria-label="Refresh API status"
            className="focus-ring"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-raised)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: checkingHealth ? 'not-allowed' : 'pointer',
              opacity: checkingHealth ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!checkingHealth) {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-sunken)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-raised)';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: checkingHealth ? 'spin-slow 1s linear infinite' : 'none',
              }}
            />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="focus-ring"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface-raised)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-lime-subtle)';
              e.currentTarget.style.color = isDark ? 'var(--accent-lime)' : 'var(--accent-forest)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(199,244,100,0.3)' : 'rgba(23,61,50,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-raised)';
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* --- Responsive visibility helpers --- */}
      <style>{`
        .hidden-mobile { display: inline; }
        .show-mobile-only { display: none; }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile-only { display: inline !important; }
        }
      `}</style>
    </header>
  );
}
