/**
 * Accessibility and Usability Utilities
 */

// Keyboard shortcuts handler
export const keyboardShortcuts = {
  shortcuts: new Map(),
  
  register(key, handler, description) {
    this.shortcuts.set(key, { handler, description });
  },
  
  unregister(key) {
    this.shortcuts.delete(key);
  },
  
  init() {
    document.addEventListener('keydown', (e) => {
      const key = this.getKeyString(e);
      const shortcut = this.shortcuts.get(key);
      
      if (shortcut && !this.isInputFocused(e.target)) {
        e.preventDefault();
        shortcut.handler(e);
      }
    });
  },
  
  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    parts.push(e.key);
    return parts.join('+');
  },
  
  isInputFocused(element) {
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = element.contentEditable === 'true';
    return isInput || isContentEditable;
  },
  
  getShortcutsList() {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description
    }));
  }
};

// Font size adjustment
export const fontSizeControl = {
  sizes: ['small', 'medium', 'large', 'xlarge'],
  currentSize: 'medium',
  
  init() {
    const saved = localStorage.getItem('fontSize');
    if (saved && this.sizes.includes(saved)) {
      this.setSize(saved);
    }
  },
  
  setSize(size) {
    if (!this.sizes.includes(size)) return;
    this.currentSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('fontSize', size);
  },
  
  increase() {
    const currentIndex = this.sizes.indexOf(this.currentSize);
    if (currentIndex < this.sizes.length - 1) {
      this.setSize(this.sizes[currentIndex + 1]);
    }
  },
  
  decrease() {
    const currentIndex = this.sizes.indexOf(this.currentSize);
    if (currentIndex > 0) {
      this.setSize(this.sizes[currentIndex - 1]);
    }
  }
};

// High contrast mode
export const highContrastMode = {
  enabled: false,
  
  init() {
    const saved = localStorage.getItem('highContrast');
    if (saved === 'true') {
      this.enable();
    }
  },
  
  enable() {
    this.enabled = true;
    document.documentElement.setAttribute('data-high-contrast', 'true');
    localStorage.setItem('highContrast', 'true');
  },
  
  disable() {
    this.enabled = false;
    document.documentElement.removeAttribute('data-high-contrast');
    localStorage.setItem('highContrast', 'false');
  },
  
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
};

// Tooltip helper
export const createTooltip = (element, text, position = 'top') => {
  if (!element) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    ${position === 'top' ? 'bottom: 100%;' : position === 'bottom' ? 'top: 100%;' : ''}
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-bg-dark, #111827);
    color: var(--color-text-dark, #F9FAFB);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    margin-bottom: 4px;
  `;
  
  element.style.position = 'relative';
  element.appendChild(tooltip);
  
  const show = () => {
    tooltip.style.opacity = '1';
  };
  
  const hide = () => {
    tooltip.style.opacity = '0';
  };
  
  element.addEventListener('mouseenter', show);
  element.addEventListener('mouseleave', hide);
  element.addEventListener('focus', show);
  element.addEventListener('blur', hide);
  
  return { show, hide, remove: () => tooltip.remove() };
};

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    keyboardShortcuts.init();
    fontSizeControl.init();
    highContrastMode.init();
  });
}

