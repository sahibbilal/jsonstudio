import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONViewer = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [activeAction, setActiveAction] = useState('');
  const [expandAll, setExpandAll] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB', keys: 0, depth: 0 });
  const [status, setStatus] = useState({ type: '', message: '' });

  const inputEditorRef = useRef(null);
  const inputViewRef = useRef(null);
  const treeContainerRef = useRef(null);

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
              // Auto-parse on change
              parseJSON(value, false);
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
      setStats({ chars: 0, lines: 0, size: '0 KB', keys: 0, depth: 0 });
      return;
    }
    const chars = text.length;
    const lines = text.split('\n').length;
    const size = (chars / 1024).toFixed(2);
    
    try {
      const parsed = JSON.parse(text);
      const { keys, depth } = analyzeJSON(parsed);
      setStats({ chars, lines, size: `${size} KB`, keys, depth });
    } catch {
      setStats({ chars, lines, size: `${size} KB`, keys: 0, depth: 0 });
    }
  };

  // Analyze JSON structure
  const analyzeJSON = (obj, depth = 0, keys = 0) => {
    if (obj === null || typeof obj !== 'object') {
      return { keys, depth };
    }

    if (Array.isArray(obj)) {
      let maxDepth = depth + 1;
      let totalKeys = keys;
      obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const result = analyzeJSON(item, depth + 1, totalKeys);
          maxDepth = Math.max(maxDepth, result.depth);
          totalKeys = result.keys;
        }
      });
      return { keys: totalKeys, depth: maxDepth };
    }

    let maxDepth = depth + 1;
    let totalKeys = keys + Object.keys(obj).length;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = analyzeJSON(obj[key], depth + 1, totalKeys);
        maxDepth = Math.max(maxDepth, result.depth);
        totalKeys = result.keys;
      }
    }
    
    return { keys: totalKeys, depth: maxDepth };
  };

  // Parse JSON and render tree
  const parseJSON = (text = null, setActive = false) => {
    const jsonText = text !== null ? text : input;
    
    if (!jsonText.trim()) {
      setParsedData(null);
      setStatus({ type: '', message: '' });
      if (setActive) {
        setActiveAction('');
        showToast('Please enter some JSON to view', 'warning');
      }
      return false;
    }

    try {
      const parsed = JSON.parse(jsonText);
      setParsedData(parsed);
      setStatus({ type: 'valid', message: '✓ JSON parsed successfully' });
      if (setActive) {
        setActiveAction('view');
        showToast('JSON parsed successfully!', 'success');
      }
      return true;
    } catch (error) {
      setParsedData(null);
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
      if (setActive) {
        setActiveAction('');
        showToast(`Invalid JSON: ${error.message}`, 'error');
      }
      return false;
    }
  };

  // TreeNode component
  const TreeNode = ({ data, keyName = null, path = '', level = 0, expandAll }) => {
    const [isExpanded, setIsExpanded] = React.useState(expandAll);
    
    React.useEffect(() => {
      setIsExpanded(expandAll);
    }, [expandAll]);

    const nodeKey = path || 'root';
    const isArray = Array.isArray(data);
    const isObject = typeof data === 'object' && data !== null && !isArray;
    const isPrimitive = !isArray && !isObject;

    if (isPrimitive) {
      return (
        <div key={nodeKey} style={{ paddingLeft: `${level * 20}px`, marginBottom: '4px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {keyName && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>"{keyName}": </span>}
            <span style={{ 
              color: data === null ? 'var(--color-text-muted)' : 
                     typeof data === 'string' ? '#10b981' : 
                     typeof data === 'number' ? '#3b82f6' : 
                     typeof data === 'boolean' ? '#f59e0b' : 'var(--color-text)'
            }}>
              {typeof data === 'string' ? `"${data}"` : String(data)}
            </span>
          </span>
        </div>
      );
    }

    const entries = isArray ? data.map((item, index) => [index, item]) : Object.entries(data);
    const isEmpty = entries.length === 0;

    return (
      <div key={nodeKey} style={{ marginBottom: '4px' }}>
        <div 
          style={{ 
            paddingLeft: `${level * 20}px`,
            cursor: isEmpty ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none'
          }}
          onClick={() => !isEmpty && setIsExpanded(!isExpanded)}
        >
          {!isEmpty && (
            <span style={{ 
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              width: '16px',
              display: 'inline-block'
            }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span style={{ 
            color: isArray ? '#8b5cf6' : '#ec4899',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            {keyName && <span style={{ color: 'var(--color-primary)' }}>"{keyName}": </span>}
            {isArray ? '[' : '{'}
            {isEmpty && <span style={{ color: 'var(--color-text-muted)' }}>empty</span>}
            {!isEmpty && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}> {entries.length} {entries.length === 1 ? 'item' : 'items'}</span>}
          </span>
        </div>
        {isExpanded && !isEmpty && (
          <div style={{ marginLeft: '20px' }}>
            {entries.map(([entryKey, value]) => (
              <TreeNode 
                key={`${path}.${entryKey}`}
                data={value} 
                keyName={isArray ? null : entryKey} 
                path={`${path}.${entryKey}`} 
                level={level + 1}
                expandAll={expandAll}
              />
            ))}
          </div>
        )}
        <div style={{ paddingLeft: `${level * 20}px` }}>
          <span style={{ 
            color: isArray ? '#8b5cf6' : '#ec4899',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            {isArray ? ']' : '}'}
          </span>
        </div>
      </div>
    );
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
    setParsedData(null);
    setStats({ chars: 0, lines: 0, size: '0 KB', keys: 0, depth: 0 });
    setStatus({ type: '', message: '' });
    setActiveAction('');
  };

  // Expand/Collapse all
  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
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
    <div className="json-viewer-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
      {/* Input Side */}
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
                onClick={() => parseJSON(null, true)} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'view' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'view' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                View Tree
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
              <span>{stats.chars.toLocaleString()} chars</span>
              <span>{stats.lines} lines</span>
              <span>{stats.size}</span>
            </div>
            <div className={`editor-status ${status.type ? `status-${status.type}` : ''}`} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {status.message}
            </div>
          </div>
        </div>
      </div>

      {/* Tree View Side */}
      <div className="tree-view-container" style={{ 
        width: '100%', 
        maxWidth: '100%', 
        boxSizing: 'border-box', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div className="tree-view-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Tree View</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button 
              onClick={toggleExpandAll}
              style={{ 
                padding: 'var(--spacing-xs) var(--spacing-md)', 
                borderRadius: 'var(--radius-2xl)', 
                border: 'none', 
                cursor: 'pointer', 
                backgroundColor: 'var(--color-bg-secondary)', 
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
        <div 
          ref={treeContainerRef}
          className="tree-view-content" 
          style={{ 
            flex: '1 1 auto',
            minHeight: '400px',
            maxHeight: '600px',
            overflow: 'auto',
            padding: 'var(--spacing-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}
        >
          {parsedData ? (
            <TreeNode data={parsedData} expandAll={expandAll} />
          ) : (
            <div style={{ 
              color: 'var(--color-text-secondary)', 
              textAlign: 'center', 
              padding: 'var(--spacing-xl)',
              fontSize: '0.875rem'
            }}>
              Enter JSON in the editor to view the tree structure
            </div>
          )}
        </div>
        <div className="tree-view-footer" style={{ 
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-sm)',
          flexShrink: 0,
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)'
        }}>
          <div>
            {stats.keys > 0 && <span>Keys: {stats.keys} • </span>}
            {stats.depth > 0 && <span>Depth: {stats.depth}</span>}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="tool-sidebar" style={{ 
        gridColumn: '1 / -1',
        marginTop: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-lg)'
      }}>
        <div className="tool-info">
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Tree Viewer Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            This tool displays JSON data in a visual tree structure. Features:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Click nodes to expand/collapse</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Color-coded: Objects (pink), Arrays (purple), Strings (green), Numbers (blue)</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Shows item counts for objects and arrays</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Auto-updates as you type</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONViewer;

