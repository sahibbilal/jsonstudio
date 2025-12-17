import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONValidator = () => {
  const [input, setInput] = useState('');
  const [activeAction, setActiveAction] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const [checkDuplicates, setCheckDuplicates] = useState(false);
  const [checkTrailingCommas, setCheckTrailingCommas] = useState(false);
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB' });
  const [status, setStatus] = useState({ type: '', message: '', errors: [] });

  const inputEditorRef = useRef(null);
  const inputViewRef = useRef(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                   document.body.classList.contains('dark-mode');

    // Input editor
    if (inputEditorRef.current && !inputViewRef.current) {
      const inputState = EditorState.create({
        doc: '',
        extensions: [
          lineNumbers(),
          history(),
          json(),
          keymap.of(historyKeymap),
          isDark ? oneDark : [],
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const value = update.state.doc.toString();
              setInput(value);
              updateStats(value);
              // Auto-validate on change (but don't set active action)
              validateJSON(value, false);
            }
          }),
        ],
      });

      inputViewRef.current = new EditorView({
        state: inputState,
        parent: inputEditorRef.current,
      });
      
      // Force refresh after a short delay to ensure proper rendering
      setTimeout(() => {
        if (inputViewRef.current) {
          inputViewRef.current.requestMeasure();
        }
      }, 100);
    }

    return () => {
      if (inputViewRef.current) {
        inputViewRef.current.destroy();
      }
    };
  }, []);

  // Update stats
  const updateStats = (text) => {
    if (!text) {
      setStats({ chars: 0, lines: 0, size: '0 KB' });
      return;
    }
    const chars = text.length;
    const lines = text.split('\n').length;
    const size = (chars / 1024).toFixed(2);
    setStats({ chars, lines, size: `${size} KB` });
  };

  // Check for duplicate keys
  const checkDuplicateKeys = (obj, path = '', duplicates = []) => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return duplicates;
    }

    const seen = new Set();
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      if (seen.has(key)) {
        duplicates.push({
          key: currentPath,
          message: `Duplicate key: "${key}"`,
        });
      }
      seen.add(key);
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkDuplicateKeys(obj[key], currentPath, duplicates);
      }
    }
    return duplicates;
  };

  // Check for trailing commas (basic check)
  const checkTrailingCommasInText = (text) => {
    const errors = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Check for trailing comma before closing brace/bracket
      if (trimmed.match(/,\s*[}\]],?\s*$/)) {
        errors.push({
          line: index + 1,
          message: 'Trailing comma detected',
        });
      }
    });
    
    return errors;
  };

  // Validate JSON
  const validateJSON = (text = null, setActive = false) => {
    const jsonText = text !== null ? text : input;
    const errors = [];
    
    if (!jsonText.trim()) {
      setStatus({ type: '', message: '', errors: [] });
      if (setActive) {
        setActiveAction('');
        showToast('Please enter some JSON to validate', 'warning');
      }
      return false;
    }

    // Check for trailing commas if option is enabled
    if (checkTrailingCommas) {
      const trailingCommaErrors = checkTrailingCommasInText(jsonText);
      if (trailingCommaErrors.length > 0) {
        errors.push(...trailingCommaErrors);
      }
    }

    try {
      const parsed = JSON.parse(jsonText);
      
      // Check for duplicate keys if option is enabled
      if (checkDuplicates) {
        const duplicateErrors = checkDuplicateKeys(parsed);
        if (duplicateErrors.length > 0) {
          errors.push(...duplicateErrors);
        }
      }

      // Strict mode checks
      if (strictMode) {
        // Check for undefined values (not allowed in strict JSON)
        const jsonString = JSON.stringify(parsed);
        if (jsonString.includes('undefined')) {
          errors.push({
            message: 'Strict mode: undefined values are not allowed',
          });
        }
      }

      if (errors.length > 0) {
        setStatus({ 
          type: 'warning', 
          message: `JSON is valid but has ${errors.length} warning(s)`, 
          errors 
        });
        if (setActive) {
          setActiveAction('validate');
          showToast(`JSON is valid but has ${errors.length} warning(s)`, 'warning');
        }
        return true; // Valid JSON but with warnings
      } else {
        setStatus({ type: 'valid', message: '✓ Valid JSON', errors: [] });
        if (setActive) {
          setActiveAction('validate');
          showToast('JSON is valid!', 'success');
        }
        return true;
      }
    } catch (error) {
      // Parse error details
      const errorMatch = error.message.match(/position (\d+)/);
      const position = errorMatch ? parseInt(errorMatch[1], 10) : 0;
      const lines = jsonText.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length;

      setStatus({ 
        type: 'invalid', 
        message: `✗ ${error.message}`, 
        errors: [{
          line,
          column,
          message: error.message,
        }]
      });
      if (setActive) {
        setActiveAction('validate');
        showToast(`Invalid JSON: ${error.message}`, 'error');
      }
      return false;
    }
  };

  // Clear editor
  const clearEditor = () => {
    if (inputViewRef.current) {
      inputViewRef.current.dispatch({
        changes: {
          from: 0,
          to: inputViewRef.current.state.doc.length,
          insert: '',
        },
      });
    }
    setInput('');
    setStats({ chars: 0, lines: 0, size: '0 KB' });
    setStatus({ type: '', message: '', errors: [] });
    setActiveAction('');
  };

  // Show toast notification
  const showToast = (message, type = 'info') => {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  };

  return (
    <div className="json-validator-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
      <div className="tool-editor-container" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="tool-editor-wrapper" style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="tool-editor-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            flexShrink: 0
          }}>
            <div className="tool-tabs" style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <span style={{ 
                padding: 'var(--spacing-sm) var(--spacing-md)', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: 'var(--color-primary)', 
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                JSON Input
              </span>
            </div>
            <div className="tool-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-sm" 
                onClick={() => validateJSON(null, true)} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'validate' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'validate' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Validate
              </button>
              <button 
                className="btn btn-sm" 
                onClick={clearEditor} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: 'var(--color-bg-secondary)', 
                  color: 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="tool-editor-content" style={{ 
            width: '100%', 
            maxWidth: '100%', 
            overflow: 'hidden',
            flex: '1 1 auto',
            minHeight: '400px',
            maxHeight: '600px',
            position: 'relative'
          }}>
            <div
              ref={inputEditorRef}
              className="json-editor-wrapper"
              style={{ 
                display: 'block',
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            />
          </div>
          <div className="tool-editor-footer" style={{ 
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
            flexShrink: 0
          }}>
            <div className="editor-stats" style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <span>{stats.chars.toLocaleString()} characters</span>
              <span>{stats.lines} lines</span>
              <span>{stats.size}</span>
            </div>
            <div className={`editor-status ${status.type ? `status-${status.type}` : ''}`} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {status.message}
            </div>
          </div>
        </div>
        
        {/* Validation Results */}
        {status.errors && status.errors.length > 0 && (
          <div className="validation-results" style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: status.type === 'invalid' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${status.type === 'invalid' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
              {status.type === 'invalid' ? 'Errors:' : 'Warnings:'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
              {status.errors.map((error, index) => (
                <li key={index} style={{ marginBottom: 'var(--spacing-xs)' }}>
                  {error.line && `Line ${error.line}: `}
                  {error.column && `Column ${error.column}: `}
                  {error.key && `Key "${error.key}": `}
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <aside className="tool-sidebar" style={{ flex: '0 0 300px', minWidth: '300px' }}>
        <div className="tool-options" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>
            Validation Options
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="strict-mode"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Strict Mode</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="check-duplicates"
                  checked={checkDuplicates}
                  onChange={(e) => setCheckDuplicates(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Check for Duplicate Keys</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="check-trailing-commas"
                  checked={checkTrailingCommas}
                  onChange={(e) => setCheckTrailingCommas(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Check for Trailing Commas</span>
              </label>
            </div>
          </div>
        </div>

        <div className="tool-info" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Validation Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            This tool validates JSON syntax and structure. It checks for:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Valid JSON syntax</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Proper brackets and braces</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Correct string escaping</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Valid number formats</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONValidator;

