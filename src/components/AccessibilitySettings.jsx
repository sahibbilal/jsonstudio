import React, { useState, useEffect } from 'react';

const AccessibilitySettings = () => {
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    setFontSize(savedFontSize);
    setHighContrast(savedHighContrast);
    applyFontSize(savedFontSize);
    applyHighContrast(savedHighContrast);
  }, []);

  const applyFontSize = (size) => {
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('fontSize', size);
  };

  const applyHighContrast = (enabled) => {
    if (enabled) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
      localStorage.setItem('highContrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
      localStorage.setItem('highContrast', 'false');
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    applyFontSize(size);
  };

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    applyHighContrast(newValue);
  };

  const shortcuts = [
    { key: 'Ctrl+B / Cmd+B', description: 'Beautify JSON' },
    { key: 'Ctrl+M / Cmd+M', description: 'Minify JSON' },
    { key: 'Ctrl+V / Cmd+V', description: 'Validate JSON' },
    { key: 'Ctrl+C / Cmd+C', description: 'Copy to clipboard' },
    { key: 'Ctrl+S / Cmd+S', description: 'Download as file' },
    { key: 'Ctrl+/ / Cmd+/', description: 'Show keyboard shortcuts' },
    { key: 'Ctrl+D / Cmd+D', description: 'Toggle dark mode' },
    { key: 'Esc', description: 'Close dialogs/menus' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'block'
    }}>
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        aria-label="Accessibility settings"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Accessibility Settings"
      >
        ♿
      </button>

      {showShortcuts && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: 0,
          width: '320px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Accessibility Settings</h3>
            <button
              onClick={() => setShowShortcuts(false)}
              aria-label="Close settings"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--color-text)'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
              Font Size
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              {['small', 'medium', 'large', 'xlarge'].map(size => (
                <button
                  key={size}
                  onClick={() => handleFontSizeChange(size)}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-xs)',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${fontSize === size ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: fontSize === size ? 'var(--color-primary)' : 'transparent',
                    color: fontSize === size ? '#fff' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize'
                  }}
                  aria-pressed={fontSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={handleHighContrastToggle}
                style={{ cursor: 'pointer' }}
                aria-label="Enable high contrast mode"
              />
              <span style={{ fontSize: '0.875rem' }}>High Contrast Mode</span>
            </label>
          </div>

          <div>
            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600 }}>Keyboard Shortcuts</h4>
            <div style={{ fontSize: '0.75rem' }}>
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: 'var(--spacing-xs)',
                  padding: '4px 0'
                }}>
                  <kbd style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem'
                  }}>
                    {shortcut.key}
                  </kbd>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilitySettings;

