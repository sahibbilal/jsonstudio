import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONBeautifier = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [activeAction, setActiveAction] = useState(''); // Track which action button is active
  const [indentSize, setIndentSize] = useState(4);
  const [sortKeys, setSortKeys] = useState(false);
  const [escapeUnicode, setEscapeUnicode] = useState(false);
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB' });
  const [status, setStatus] = useState({ type: '', message: '' });

  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const inputViewRef = useRef(null);
  const outputViewRef = useRef(null);

  // Initialize CodeMirror editors
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
    }

    // Output editor (read-only)
    if (outputEditorRef.current && !outputViewRef.current) {
      const outputState = EditorState.create({
        doc: '',
        extensions: [
          lineNumbers(),
          history(),
          json(),
          keymap.of(historyKeymap),
          isDark ? oneDark : [],
          EditorView.editable.of(false),
        ],
      });

      outputViewRef.current = new EditorView({
        state: outputState,
        parent: outputEditorRef.current,
      });
      
      // Force refresh after a short delay to ensure proper rendering
      setTimeout(() => {
        if (outputViewRef.current) {
          outputViewRef.current.requestMeasure();
        }
      }, 100);
    }

    return () => {
      if (inputViewRef.current) {
        inputViewRef.current.destroy();
      }
      if (outputViewRef.current) {
        outputViewRef.current.destroy();
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

  // Validate JSON
  const validateJSON = (text = null, setActive = false) => {
    const jsonText = text !== null ? text : input;
    
    if (!jsonText.trim()) {
      setStatus({ type: '', message: '' });
      if (setActive) {
        setActiveAction('');
        showToast('Please enter some JSON to validate', 'warning');
      }
      return false;
    }

    try {
      JSON.parse(jsonText);
      setStatus({ type: 'valid', message: '✓ Valid JSON' });
      if (setActive) {
        setActiveAction('validate');
        showToast('JSON is valid!', 'success');
      }
      return true;
    } catch (error) {
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
      if (setActive) {
        setActiveAction('validate');
        showToast(`Invalid JSON: ${error.message}`, 'error');
      }
      return false;
    }
  };

  // Recursively sort object keys
  const sortObjectKeys = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sortObjectKeys(item));
    }

    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
  };

  // Beautify JSON
  const beautifyJSON = () => {
    if (!input.trim()) {
      showToast('Please enter some JSON', 'warning');
      setActiveAction('');
      return;
    }

    try {
      let parsed = JSON.parse(input);
      
      // Sort keys recursively if option is enabled
      if (sortKeys) {
        parsed = sortObjectKeys(parsed);
      }

      const indent = indentSize === '\\t' ? '\t' : parseInt(indentSize, 10);
      const formatted = JSON.stringify(parsed, null, indent);

      setOutput(formatted);
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: formatted,
          },
        });
      }
      setActiveTab('output');
      setActiveAction('beautify');
      showToast('JSON beautified successfully!', 'success');
      updateStats(formatted);
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      validateJSON(input, false);
    }
  };

  // Minify JSON
  const minifyJSON = () => {
    if (!input.trim()) {
      showToast('Please enter some JSON', 'warning');
      setActiveAction('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: minified,
          },
        });
      }
      setActiveTab('output');
      setActiveAction('minify');
      showToast('JSON minified successfully!', 'success');
      updateStats(minified);
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      validateJSON(input, false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const text = output || input;
    if (!text) {
      showToast('No content to copy', 'warning');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  // Clear editors
  const clearEditors = () => {
    if (confirm('Are you sure you want to clear the editor?')) {
      if (inputViewRef.current) {
        inputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: inputViewRef.current.state.doc.length,
            insert: '',
          },
        });
      }
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: '',
          },
        });
      }
      setInput('');
      setOutput('');
      setStats({ chars: 0, lines: 0, size: '0 KB' });
      setStatus({ type: '', message: '' });
      setActiveTab('input');
    }
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
    <div className="json-beautifier-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
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
              <button
                className={`tool-tab ${activeTab === 'input' ? 'active' : ''}`}
                onClick={() => setActiveTab('input')}
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none', 
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'input' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'input' ? '#fff' : 'var(--color-text)'
                }}
              >
                Input
              </button>
              <button
                className={`tool-tab ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none', 
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'output' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'output' ? '#fff' : 'var(--color-text)'
                }}
              >
                Output
              </button>
            </div>
            <div className="tool-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-sm" 
                onClick={beautifyJSON} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'beautify' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'beautify' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Beautify
              </button>
              <button 
                className="btn btn-sm" 
                onClick={minifyJSON} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'minify' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'minify' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Minify
              </button>
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
                onClick={copyToClipboard} 
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
                Copy
              </button>
              <button 
                className="btn btn-sm" 
                onClick={clearEditors} 
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
                display: activeTab === 'input' ? 'block' : 'none',
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
            <div
              ref={outputEditorRef}
              className="json-editor-wrapper"
              style={{ 
                display: activeTab === 'output' ? 'block' : 'none',
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
      </div>

      <aside className="tool-sidebar">
        <div className="tool-options">
          <h3 className="options-title">Formatting Options</h3>
          <div className="options-content">
            <div className="option-group">
              <label htmlFor="indent-size">Indent Size</label>
              <select
                id="indent-size"
                className="option-select"
                value={indentSize}
                onChange={(e) => setIndentSize(e.target.value)}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
                <option value="\\t">Tab</option>
              </select>
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="sort-keys"
                  checked={sortKeys}
                  onChange={(e) => setSortKeys(e.target.checked)}
                />
                Sort Keys Alphabetically
              </label>
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="escape-unicode"
                  checked={escapeUnicode}
                  onChange={(e) => setEscapeUnicode(e.target.checked)}
                />
                Escape Unicode Characters
              </label>
            </div>
          </div>
        </div>

        <div className="tool-info">
          <h3>Tips</h3>
          <ul className="tips-list">
            <li>Paste or type JSON in the input editor</li>
            <li>Click Beautify to format with proper indentation</li>
            <li>Click Minify to compress JSON to a single line</li>
            <li>Use Validate to check JSON syntax</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONBeautifier;

