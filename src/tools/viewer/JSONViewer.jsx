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
  const [expandLevel, setExpandLevel] = useState(null); // null = all, number = specific level
  const [selectedPath, setSelectedPath] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState('both'); // 'key', 'value', 'both'
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showDataTypes, setShowDataTypes] = useState(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB', keys: 0, depth: 0 });
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Export options
  const [exportFilename, setExportFilename] = useState('json-data');
  const [exportEncoding, setExportEncoding] = useState('utf-8');
  const [lineEnding, setLineEnding] = useState('lf');
  const [exportSelectedOnly, setExportSelectedOnly] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

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

  // Get data type label
  const getDataType = (data) => {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    if (typeof data === 'object') return 'object';
    return typeof data;
  };

  // Check if node matches search
  const matchesSearch = (keyName, value, path) => {
    if (!searchQuery) return { match: false, highlight: false };
    
    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    let keyMatch = false;
    let valueMatch = false;
    
    if (searchBy === 'key' || searchBy === 'both') {
      const keyStr = keyName ? (caseSensitive ? keyName : keyName.toLowerCase()) : '';
      keyMatch = keyStr.includes(query);
    }
    
    if (searchBy === 'value' || searchBy === 'both') {
      const valueStr = typeof value === 'string' 
        ? (caseSensitive ? value : value.toLowerCase())
        : String(value).toLowerCase();
      valueMatch = valueStr.includes(query);
    }
    
    const match = keyMatch || valueMatch;
    return { match, highlight: match, keyMatch, valueMatch };
  };

  // Find all search matches
  const findSearchMatches = (data, path = '', matches = []) => {
    if (data === null || typeof data !== 'object') {
      const { match } = matchesSearch(null, data, path);
      if (match) {
        matches.push({ path, type: 'value' });
      }
      return matches;
    }

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemPath = path ? `${path}[${index}]` : `[${index}]`;
        const { match } = matchesSearch(null, item, itemPath);
        if (match) {
          matches.push({ path: itemPath, type: 'value' });
        }
        if (typeof item === 'object' && item !== null) {
          findSearchMatches(item, itemPath, matches);
        }
      });
    } else {
      for (const key in data) {
        const keyPath = path ? `${path}.${key}` : key;
        const { match, keyMatch } = matchesSearch(key, data[key], keyPath);
        if (match) {
          matches.push({ path: keyPath, type: keyMatch ? 'key' : 'value' });
        }
        if (typeof data[key] === 'object' && data[key] !== null) {
          findSearchMatches(data[key], keyPath, matches);
        }
      }
    }
    
    return matches;
  };

  // Update search results when query changes
  React.useEffect(() => {
    if (parsedData && searchQuery) {
      const matches = findSearchMatches(parsedData);
      setSearchResults(matches);
      setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    } else {
      setSearchResults([]);
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, searchBy, caseSensitive, parsedData]);

  // TreeNode component
  const TreeNode = ({ data, keyName = null, path = '', level = 0, expandAll, expandLevel, selectedPath, onNodeClick, searchMatch, searchResults, currentMatchIndex, copyPathToClipboard }) => {
    const [isExpanded, setIsExpanded] = React.useState(() => {
      if (expandLevel !== null) {
        return level < expandLevel;
      }
      return expandAll;
    });
    
    React.useEffect(() => {
      if (expandLevel !== null) {
        setIsExpanded(level < expandLevel);
      } else {
        setIsExpanded(expandAll);
      }
    }, [expandAll, expandLevel, level]);

    const isSelected = selectedPath === path;
    const nodeMatch = searchMatch || matchesSearch(keyName, data, path);
    const isCurrentMatch = searchResults && searchResults.length > 0 && currentMatchIndex >= 0 && searchResults[currentMatchIndex]?.path === path;

    const nodeKey = path || 'root';
    const isArray = Array.isArray(data);
    const isObject = typeof data === 'object' && data !== null && !isArray;
    const isPrimitive = !isArray && !isObject;

    if (isPrimitive) {
      const dataType = getDataType(data);
      return (
        <div 
          key={nodeKey}
          data-path={path}
          style={{ 
            paddingLeft: `${level * 20}px`, 
            marginBottom: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isCurrentMatch ? 'rgba(59, 130, 246, 0.3)' : isSelected ? 'rgba(59, 130, 246, 0.2)' : nodeMatch.highlight ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            border: isCurrentMatch ? '2px solid #3b82f6' : isSelected ? '2px solid #3b82f6' : nodeMatch.highlight ? '1px solid #f59e0b' : 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-base)'
          }}
          onClick={() => onNodeClick && onNodeClick(path)}
          onContextMenu={(e) => {
            e.preventDefault();
            copyPathToClipboard(path);
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {keyName && (
              <span style={{ 
                color: nodeMatch.keyMatch ? '#f59e0b' : 'var(--color-primary)', 
                fontWeight: 600,
                backgroundColor: nodeMatch.keyMatch ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                padding: nodeMatch.keyMatch ? '2px 4px' : 0,
                borderRadius: 'var(--radius-xs)'
              }}>
                "{keyName}": 
              </span>
            )}
            <span style={{ 
              color: data === null ? 'var(--color-text-muted)' : 
                     typeof data === 'string' ? '#10b981' : 
                     typeof data === 'number' ? '#3b82f6' : 
                     typeof data === 'boolean' ? '#f59e0b' : 'var(--color-text)',
              backgroundColor: nodeMatch.valueMatch ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
              padding: nodeMatch.valueMatch ? '2px 4px' : 0,
              borderRadius: 'var(--radius-xs)'
            }}>
              {typeof data === 'string' ? `"${data}"` : String(data)}
            </span>
            {showDataTypes && (
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                marginLeft: '8px'
              }}>
                ({dataType})
              </span>
            )}
          </span>
        </div>
      );
    }

    const entries = isArray ? data.map((item, index) => [index, item]) : Object.entries(data);
    const isEmpty = entries.length === 0;

    return (
      <div key={nodeKey} data-path={path} style={{ marginBottom: '4px' }}>
        <div 
          style={{ 
            paddingLeft: `${level * 20}px`,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: isEmpty ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none',
            backgroundColor: isCurrentMatch ? 'rgba(59, 130, 246, 0.3)' : isSelected ? 'rgba(59, 130, 246, 0.2)' : nodeMatch.highlight ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            border: isCurrentMatch ? '2px solid #3b82f6' : isSelected ? '2px solid #3b82f6' : nodeMatch.highlight ? '1px solid #f59e0b' : 'none',
            transition: 'all var(--transition-base)'
          }}
          onClick={(e) => {
            if (!isEmpty) {
              setIsExpanded(!isExpanded);
            }
            if (onNodeClick) {
              onNodeClick(path);
            }
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            copyPathToClipboard(path);
          }}
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
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {keyName && (
              <span style={{ 
                color: nodeMatch.keyMatch ? '#f59e0b' : 'var(--color-primary)',
                backgroundColor: nodeMatch.keyMatch ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                padding: nodeMatch.keyMatch ? '2px 4px' : 0,
                borderRadius: 'var(--radius-xs)'
              }}>
                "{keyName}": 
              </span>
            )}
            {isArray ? '[' : '{'}
            {isEmpty && <span style={{ color: 'var(--color-text-muted)' }}>empty</span>}
            {!isEmpty && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}> {entries.length} {entries.length === 1 ? 'item' : 'items'}</span>}
            {showDataTypes && (
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-muted)',
                fontStyle: 'italic'
              }}>
                ({isArray ? 'array' : 'object'})
              </span>
            )}
          </span>
        </div>
        {isExpanded && !isEmpty && (
          <div style={{ marginLeft: '20px' }}>
            {entries.map(([entryKey, value]) => {
              const childPath = isArray ? `${path}[${entryKey}]` : `${path}.${entryKey}`;
              const childMatch = matchesSearch(isArray ? null : entryKey, value, childPath);
              return (
                <TreeNode 
                  key={childPath}
                  data={value} 
                  keyName={isArray ? null : entryKey} 
                  path={childPath} 
                  level={level + 1}
                  expandAll={expandAll}
                  expandLevel={expandLevel}
                  selectedPath={selectedPath}
                  onNodeClick={onNodeClick}
                  searchMatch={childMatch}
                  searchResults={searchResults}
                  currentMatchIndex={currentMatchIndex}
                  copyPathToClipboard={copyPathToClipboard}
                />
              );
            })}
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
    setExpandLevel(null);
  };

  // Expand/Collapse to specific level
  const setExpandToLevel = (level) => {
    if (level === null) {
      setExpandAll(true);
      setExpandLevel(null);
    } else {
      setExpandLevel(level);
      setExpandAll(false);
    }
  };

  // Copy path to clipboard
  const copyPathToClipboard = (path) => {
    if (!path) return;
    navigator.clipboard.writeText(path).then(() => {
      showToast(`Path copied: ${path}`, 'success');
    }).catch(() => {
      showToast('Failed to copy path', 'error');
    });
  };

  // Get value by path
  const getValueByPath = (obj, path) => {
    if (!path || path === 'root') return obj;
    
    const parts = path.split(/[\.\[\]]/).filter(p => p);
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (Array.isArray(current)) {
        const index = parseInt(part, 10);
        if (isNaN(index)) return undefined;
        current = current[index];
      } else if (typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  };

  // Normalize line endings
  const normalizeLineEndings = (text) => {
    let normalized = text;
    if (lineEnding === 'crlf') {
      normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
    } else if (lineEnding === 'cr') {
      normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r');
    } else {
      normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    return normalized;
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    let dataToExport = parsedData;
    
    if (exportSelectedOnly && selectedPath) {
      dataToExport = getValueByPath(parsedData, selectedPath);
      if (dataToExport === undefined) {
        showToast('Selected path not found', 'warning');
        return;
      }
    }
    
    if (!dataToExport) {
      showToast('No data to copy', 'warning');
      return;
    }

    const text = JSON.stringify(dataToExport, null, 2);
    const normalized = normalizeLineEndings(text);
    
    navigator.clipboard.writeText(normalized).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  // Download as file
  const downloadAsFile = (compress = false) => {
    let dataToExport = parsedData;
    
    if (exportSelectedOnly && selectedPath) {
      dataToExport = getValueByPath(parsedData, selectedPath);
      if (dataToExport === undefined) {
        showToast('Selected path not found', 'warning');
        return;
      }
    }
    
    if (!dataToExport) {
      showToast('No data to download', 'warning');
      return;
    }

    const text = JSON.stringify(dataToExport, null, 2);
    const normalized = normalizeLineEndings(text);
    const filename = exportFilename || 'json-data';
    const extension = compress ? 'json.gz' : 'json';
    const fullFilename = filename.endsWith('.json') ? (compress ? filename.replace('.json', '.json.gz') : filename) : `${filename}.${extension}`;

    if (compress) {
      if (window.CompressionStream) {
        const stream = new Blob([normalized]).stream();
        const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
        new Response(compressedStream).blob().then(compressedBlob => {
          const url = URL.createObjectURL(compressedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fullFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('File downloaded (compressed)!', 'success');
        }).catch(() => {
          showToast('Compression failed. Downloading uncompressed.', 'warning');
          downloadAsFile(false);
        });
      } else {
        showToast('Compression not supported. Downloading uncompressed.', 'warning');
        downloadAsFile(false);
      }
    } else {
      const blob = new Blob([normalized], { 
        type: `application/json;charset=${exportEncoding}` 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fullFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File downloaded!', 'success');
    }
  };

  // Download compressed
  const downloadCompressed = () => {
    downloadAsFile(true);
  };

  // Handle node click
  const handleNodeClick = (path) => {
    setSelectedPath(path);
    copyPathToClipboard(path);
  };

  // Jump to next/previous match
  const jumpToMatch = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentMatchIndex <= 0 ? searchResults.length - 1 : currentMatchIndex - 1;
    }
    
    setCurrentMatchIndex(newIndex);
    const match = searchResults[newIndex];
    if (match) {
      setSelectedPath(match.path);
      // Scroll to element
      setTimeout(() => {
        const element = document.querySelector(`[data-path="${match.path}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn btn-sm" 
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  onBlur={() => setTimeout(() => setShowExportOptions(false), 200)}
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
                  Export ▼
                </button>
                {showExportOptions && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 'var(--spacing-xs)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-sm)',
                    minWidth: '200px',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => { downloadAsFile(false); setShowExportOptions(false); }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        marginBottom: 'var(--spacing-xs)',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      📥 Download as File
                    </button>
                    <button
                      onClick={() => { downloadCompressed(); setShowExportOptions(false); }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      📦 Download Compressed
                    </button>
                  </div>
                )}
              </div>
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
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          
          {/* Search & Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)'
                }}
              />
              {searchQuery && searchResults.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <button
                    onClick={() => jumpToMatch('prev')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-bg)',
                      fontSize: '0.75rem'
                    }}
                    title="Previous match"
                  >
                    ↑
                  </button>
                  <span>{currentMatchIndex + 1} / {searchResults.length}</span>
                  <button
                    onClick={() => jumpToMatch('next')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-bg)',
                      fontSize: '0.75rem'
                    }}
                    title="Next match"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="both">Key & Value</option>
                <option value="key">Key Only</option>
                <option value="value">Value Only</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Case Sensitive
              </label>
            </div>
          </div>

          {/* Expand Level Controls */}
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Expand to level:</span>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => setExpandToLevel(level)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  backgroundColor: expandLevel === level ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: expandLevel === level ? '#fff' : 'var(--color-text)',
                  fontSize: '0.75rem',
                  fontWeight: expandLevel === level ? 600 : 400
                }}
              >
                {level}
              </button>
            ))}
            <button
              onClick={() => setExpandToLevel(null)}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                backgroundColor: expandLevel === null && expandAll ? 'var(--color-primary)' : 'var(--color-bg)',
                color: expandLevel === null && expandAll ? '#fff' : 'var(--color-text)',
                fontSize: '0.75rem'
              }}
            >
              All
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
            <TreeNode 
              data={parsedData} 
              expandAll={expandAll}
              expandLevel={expandLevel}
              selectedPath={selectedPath}
              onNodeClick={handleNodeClick}
              searchMatch={matchesSearch(null, parsedData, 'root')}
              searchResults={searchResults}
              currentMatchIndex={currentMatchIndex}
              copyPathToClipboard={copyPathToClipboard}
            />
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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--spacing-lg)'
      }}>
        <div className="tool-options" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Export Options</h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="export-filename-viewer" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Filename
              </label>
              <input
                id="export-filename-viewer"
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="json-data"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="export-encoding-viewer" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Encoding
              </label>
              <select
                id="export-encoding-viewer"
                value={exportEncoding}
                onChange={(e) => setExportEncoding(e.target.value)}
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
                <option value="utf-8">UTF-8</option>
                <option value="utf-16">UTF-16</option>
                <option value="ascii">ASCII</option>
              </select>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="line-ending-viewer" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Line Ending
              </label>
              <select
                id="line-ending-viewer"
                value={lineEnding}
                onChange={(e) => setLineEnding(e.target.value)}
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
                <option value="lf">LF (Unix/Linux/Mac)</option>
                <option value="crlf">CRLF (Windows)</option>
                <option value="cr">CR (Old Mac)</option>
              </select>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={exportSelectedOnly}
                  onChange={(e) => setExportSelectedOnly(e.target.checked)}
                  disabled={!selectedPath}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', opacity: !selectedPath ? 0.5 : 1 }}>
                  Export Selected Node Only {selectedPath && `(${selectedPath})`}
                </span>
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
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Tree Viewer Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            This tool displays JSON data in a visual tree structure. Features:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Click nodes to expand/collapse</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Right-click nodes to copy path to clipboard</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Use search to find keys or values</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Click nodes to select and copy path</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Color-coded: Objects (pink), Arrays (purple), Strings (green), Numbers (blue)</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Data types shown for each node</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Auto-updates as you type</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Export selected nodes only</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONViewer;

