import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONDiffMerge = () => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [merged, setMerged] = useState('');
  const [activeTab, setActiveTab] = useState('diff');
  const [activeAction, setActiveAction] = useState('');
  const [mergeStrategy, setMergeStrategy] = useState('deep'); // 'deep', 'shallow', 'replace'
  const [stats, setStats] = useState({ 
    input1: { chars: 0, lines: 0 }, 
    input2: { chars: 0, lines: 0 },
    merged: { chars: 0, lines: 0 }
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [differences, setDifferences] = useState([]);

  const input1EditorRef = useRef(null);
  const input2EditorRef = useRef(null);
  const mergedEditorRef = useRef(null);
  const input1ViewRef = useRef(null);
  const input2ViewRef = useRef(null);
  const mergedViewRef = useRef(null);

  // Initialize CodeMirror editors
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                   document.body.classList.contains('dark-mode');

    // Input 1 editor
    if (input1EditorRef.current && !input1ViewRef.current) {
      const input1State = EditorState.create({
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
              setInput1(value);
              updateStats('input1', value);
            }
          }),
        ],
      });

      input1ViewRef.current = new EditorView({
        state: input1State,
        parent: input1EditorRef.current,
      });
      
      setTimeout(() => {
        if (input1ViewRef.current) {
          input1ViewRef.current.requestMeasure();
        }
      }, 100);
    }

    // Input 2 editor
    if (input2EditorRef.current && !input2ViewRef.current) {
      const input2State = EditorState.create({
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
              setInput2(value);
              updateStats('input2', value);
            }
          }),
        ],
      });

      input2ViewRef.current = new EditorView({
        state: input2State,
        parent: input2EditorRef.current,
      });
      
      setTimeout(() => {
        if (input2ViewRef.current) {
          input2ViewRef.current.requestMeasure();
        }
      }, 100);
    }

    // Merged editor (read-only)
    if (mergedEditorRef.current && !mergedViewRef.current) {
      const mergedState = EditorState.create({
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

      mergedViewRef.current = new EditorView({
        state: mergedState,
        parent: mergedEditorRef.current,
      });
      
      setTimeout(() => {
        if (mergedViewRef.current) {
          mergedViewRef.current.requestMeasure();
        }
      }, 100);
    }

    return () => {
      if (input1ViewRef.current) {
        input1ViewRef.current.destroy();
      }
      if (input2ViewRef.current) {
        input2ViewRef.current.destroy();
      }
      if (mergedViewRef.current) {
        mergedViewRef.current.destroy();
      }
    };
  }, []);

  // Update stats
  const updateStats = (type, text) => {
    if (!text) {
      setStats(prev => ({
        ...prev,
        [type]: { chars: 0, lines: 0 }
      }));
      return;
    }
    const chars = text.length;
    const lines = text.split('\n').length;
    setStats(prev => ({
      ...prev,
      [type]: { chars, lines }
    }));
  };

  // Deep merge objects
  const deepMerge = (obj1, obj2) => {
    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      // Merge arrays by combining unique items
      return [...obj1, ...obj2];
    }
    if (Array.isArray(obj1) || Array.isArray(obj2)) {
      // If one is array and other is not, use obj2
      return obj2;
    }

    // Handle null values
    if (obj1 === null || obj1 === undefined) {
      return obj2;
    }
    if (obj2 === null || obj2 === undefined) {
      return obj1;
    }

    // Handle non-objects
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj2;
    }

    const result = { ...obj1 };

    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (
          typeof obj2[key] === 'object' &&
          obj2[key] !== null &&
          !Array.isArray(obj2[key]) &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(result[key])
        ) {
          result[key] = deepMerge(result[key], obj2[key]);
        } else if (Array.isArray(obj2[key]) && Array.isArray(result[key])) {
          // Merge arrays recursively
          result[key] = [...result[key], ...obj2[key]];
        } else {
          result[key] = obj2[key];
        }
      }
    }

    return result;
  };

  // Shallow merge objects
  const shallowMerge = (obj1, obj2) => {
    return { ...obj1, ...obj2 };
  };

  // Find differences between two objects
  const findDifferences = (obj1, obj2, path = '') => {
    const diffs = [];

    // Get all unique keys
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    allKeys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (!(key in obj1)) {
        diffs.push({
          path: currentPath,
          type: 'added',
          value: val2,
        });
      } else if (!(key in obj2)) {
        diffs.push({
          path: currentPath,
          type: 'removed',
          value: val1,
        });
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        if (typeof val1 === 'object' && val1 !== null && !Array.isArray(val1) &&
            typeof val2 === 'object' && val2 !== null && !Array.isArray(val2)) {
          // Recursively check nested objects
          diffs.push(...findDifferences(val1, val2, currentPath));
        } else {
          diffs.push({
            path: currentPath,
            type: 'modified',
            oldValue: val1,
            newValue: val2,
          });
        }
      }
    });

    return diffs;
  };

  // Compare JSON
  const compareJSON = () => {
    if (!input1.trim() || !input2.trim()) {
      showToast('Please enter both JSON objects to compare', 'warning');
      setActiveAction('');
      return;
    }

    try {
      const parsed1 = JSON.parse(input1);
      const parsed2 = JSON.parse(input2);

      const diffs = findDifferences(parsed1, parsed2);
      setDifferences(diffs);
      setActiveAction('diff');
      setStatus({ type: 'info', message: `Found ${diffs.length} difference(s)` });
      showToast(`Found ${diffs.length} difference(s)`, 'info');
      setActiveTab('diff');
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
    }
  };

  // Merge JSON
  const mergeJSON = () => {
    if (!input1.trim() || !input2.trim()) {
      showToast('Please enter both JSON objects to merge', 'warning');
      setActiveAction('');
      return;
    }

    try {
      const parsed1 = JSON.parse(input1);
      const parsed2 = JSON.parse(input2);

      let mergedResult;
      
      // Handle arrays at root level
      if (Array.isArray(parsed1) && Array.isArray(parsed2)) {
        switch (mergeStrategy) {
          case 'deep':
            mergedResult = [...parsed1, ...parsed2];
            break;
          case 'shallow':
            mergedResult = [...parsed1, ...parsed2];
            break;
          case 'replace':
            mergedResult = parsed2;
            break;
          default:
            mergedResult = [...parsed1, ...parsed2];
        }
      } else if (Array.isArray(parsed1) || Array.isArray(parsed2)) {
        // If one is array and other is object, can't merge - use replace
        if (mergeStrategy === 'replace') {
          mergedResult = parsed2;
        } else {
          showToast('Cannot merge array with object. Use Replace strategy.', 'warning');
          setActiveAction('');
          return;
        }
      } else {
        // Both are objects (or primitives)
        switch (mergeStrategy) {
          case 'deep':
            mergedResult = deepMerge(parsed1, parsed2);
            break;
          case 'shallow':
            mergedResult = shallowMerge(parsed1, parsed2);
            break;
          case 'replace':
            mergedResult = parsed2;
            break;
          default:
            mergedResult = deepMerge(parsed1, parsed2);
        }
      }

      // Ensure we have a valid result
      if (mergedResult === undefined || mergedResult === null) {
        throw new Error('Merge resulted in undefined or null');
      }

      const mergedString = JSON.stringify(mergedResult, null, 2);
      
      if (!mergedString || mergedString === 'null' || mergedString === 'undefined') {
        throw new Error('Merge resulted in invalid output');
      }

      setMerged(mergedString);
      
      if (mergedViewRef.current) {
        // Get current document length
        const currentLength = mergedViewRef.current.state.doc.length;
        mergedViewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentLength,
            insert: mergedString,
          },
        });
      }
      
      updateStats('merged', mergedString);
      setActiveTab('merged');
      setActiveAction('merge');
      showToast('JSON merged successfully!', 'success');
      setStatus({ type: 'valid', message: '✓ JSON merged successfully' });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
      setMerged('');
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const textToCopy = activeTab === 'merged' ? merged : 
                      activeTab === 'input1' ? input1 : input2;
    if (!textToCopy.trim()) {
      showToast('Nothing to copy', 'warning');
      return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  // Clear editors
  const clearEditors = () => {
    if (input1ViewRef.current) {
      input1ViewRef.current.dispatch({
        changes: {
          from: 0,
          to: input1ViewRef.current.state.doc.length,
          insert: '',
        },
      });
    }
    if (input2ViewRef.current) {
      input2ViewRef.current.dispatch({
        changes: {
          from: 0,
          to: input2ViewRef.current.state.doc.length,
          insert: '',
        },
      });
    }
    if (mergedViewRef.current) {
      mergedViewRef.current.dispatch({
        changes: {
          from: 0,
          to: mergedViewRef.current.state.doc.length,
          insert: '',
        },
      });
    }
    setInput1('');
    setInput2('');
    setMerged('');
    setStats({ 
      input1: { chars: 0, lines: 0 }, 
      input2: { chars: 0, lines: 0 },
      merged: { chars: 0, lines: 0 }
    });
    setStatus({ type: '', message: '' });
    setDifferences([]);
    setActiveTab('diff');
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
    <div className="json-diff-merge-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Two Input Editors Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        {/* Input 1 */}
        <div className="tool-editor-container" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="tool-editor-wrapper" style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="tool-editor-header" style={{ 
              padding: 'var(--spacing-md)',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              flexShrink: 0
            }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>JSON 1</h4>
            </div>
            <div className="tool-editor-content" style={{ 
              width: '100%', 
              maxWidth: '100%', 
              overflow: 'hidden',
              flex: '1 1 auto',
              minHeight: '300px',
              maxHeight: '400px',
              position: 'relative'
            }}>
              <div
                ref={input1EditorRef}
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
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              flexShrink: 0
            }}>
              {stats.input1.chars.toLocaleString()} chars • {stats.input1.lines} lines
            </div>
          </div>
        </div>

        {/* Input 2 */}
        <div className="tool-editor-container" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="tool-editor-wrapper" style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="tool-editor-header" style={{ 
              padding: 'var(--spacing-md)',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              flexShrink: 0
            }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>JSON 2</h4>
            </div>
            <div className="tool-editor-content" style={{ 
              width: '100%', 
              maxWidth: '100%', 
              overflow: 'hidden',
              flex: '1 1 auto',
              minHeight: '300px',
              maxHeight: '400px',
              position: 'relative'
            }}>
              <div
                ref={input2EditorRef}
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
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              flexShrink: 0
            }}>
              {stats.input2.chars.toLocaleString()} chars • {stats.input2.lines} lines
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Results */}
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
                className={`tool-tab ${activeTab === 'diff' ? 'active' : ''}`}
                onClick={() => setActiveTab('diff')}
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none', 
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'diff' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'diff' ? '#fff' : 'var(--color-text)'
                }}
              >
                Differences
              </button>
              <button
                className={`tool-tab ${activeTab === 'merged' ? 'active' : ''}`}
                onClick={() => setActiveTab('merged')}
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none', 
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'merged' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'merged' ? '#fff' : 'var(--color-text)'
                }}
              >
                Merged Result
              </button>
            </div>
            <div className="tool-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-sm" 
                onClick={compareJSON} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'diff' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'diff' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Compare
              </button>
              <button 
                className="btn btn-sm" 
                onClick={mergeJSON} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'merge' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'merge' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Merge
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
            {/* Differences View */}
            {activeTab === 'diff' && (
              <div style={{ 
                padding: 'var(--spacing-md)',
                overflow: 'auto',
                height: '100%',
                backgroundColor: 'var(--color-bg)'
              }}>
                {differences.length > 0 ? (
                  <div>
                    <h4 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Found {differences.length} difference(s):
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
                      {differences.map((diff, index) => (
                        <li key={index} style={{ marginBottom: 'var(--spacing-sm)' }}>
                          <strong style={{ color: 'var(--color-primary)' }}>{diff.path}:</strong>{' '}
                          {diff.type === 'added' && (
                            <span style={{ color: '#10b981' }}>Added: {JSON.stringify(diff.value)}</span>
                          )}
                          {diff.type === 'removed' && (
                            <span style={{ color: '#ef4444' }}>Removed: {JSON.stringify(diff.value)}</span>
                          )}
                          {diff.type === 'modified' && (
                            <span>
                              <span style={{ color: '#ef4444' }}>Old: {JSON.stringify(diff.oldValue)}</span>
                              {' → '}
                              <span style={{ color: '#10b981' }}>New: {JSON.stringify(diff.newValue)}</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={{ 
                    color: 'var(--color-text-secondary)', 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)',
                    fontSize: '0.875rem'
                  }}>
                    Click "Compare" to find differences between the two JSON objects
                  </div>
                )}
              </div>
            )}

            {/* Merged Result View */}
            {activeTab === 'merged' && (
              <div
                ref={mergedEditorRef}
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
            )}
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
              {activeTab === 'merged' && (
                <>
                  <span>{stats.merged.chars.toLocaleString()} characters</span>
                  <span>{stats.merged.lines} lines</span>
                </>
              )}
            </div>
            <div className={`editor-status ${status.type ? `status-${status.type}` : ''}`} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {status.message}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="tool-sidebar" style={{ 
        marginTop: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-lg)'
      }}>
        <div className="tool-options">
          <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>
            Merge Strategy
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Merge Mode
              </label>
              <select
                value={mergeStrategy}
                onChange={(e) => setMergeStrategy(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="deep">Deep Merge (Recursive)</option>
                <option value="shallow">Shallow Merge (Replace)</option>
                <option value="replace">Replace (Use JSON 2)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="tool-info" style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Diff & Merge Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            Compare and merge two JSON objects:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Compare finds all differences</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Deep merge combines nested objects</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Shallow merge replaces top-level keys</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Replace uses JSON 2 completely</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONDiffMerge;

