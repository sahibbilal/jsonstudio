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
  const [checkEmptyKeys, setCheckEmptyKeys] = useState(false);
  const [checkNullUndefined, setCheckNullUndefined] = useState(false);
  const [checkNesting, setCheckNesting] = useState(false);
  const [maxNestingDepth, setMaxNestingDepth] = useState(10);
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

  // Categorize and explain error in plain language
  const explainError = (errorMessage) => {
    const errorLower = errorMessage.toLowerCase();
    
    if (errorLower.includes('unexpected token')) {
      return {
        type: 'Syntax Error',
        explanation: 'There is an unexpected character or token in your JSON. Check for missing commas, colons, or extra characters.',
        category: 'syntax'
      };
    }
    if (errorLower.includes('unexpected end')) {
      return {
        type: 'Incomplete JSON',
        explanation: 'Your JSON appears to be incomplete. Check for missing closing brackets, braces, or quotes.',
        category: 'syntax'
      };
    }
    if (errorLower.includes('expected')) {
      return {
        type: 'Missing Element',
        explanation: 'A required element is missing. Check for missing commas, colons, or brackets.',
        category: 'syntax'
      };
    }
    if (errorLower.includes('bad escape')) {
      return {
        type: 'Invalid Escape Sequence',
        explanation: 'There is an invalid escape sequence in a string. Use valid escape sequences like \\n, \\t, \\", etc.',
        category: 'syntax'
      };
    }
    if (errorLower.includes('bad control character')) {
      return {
        type: 'Invalid Control Character',
        explanation: 'There is an invalid control character in your JSON. Remove or escape control characters.',
        category: 'syntax'
      };
    }
    
    return {
      type: 'Parse Error',
      explanation: errorMessage,
      category: 'syntax'
    };
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
          type: 'Duplicate Key',
          explanation: `The key "${key}" appears multiple times in the same object. JSON parsers typically use the last value.`,
          category: 'structure'
        });
      }
      seen.add(key);
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkDuplicateKeys(obj[key], currentPath, duplicates);
      }
    }
    return duplicates;
  };

  // Check for empty keys
  const findEmptyKeys = (obj, path = '', emptyKeys = []) => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return emptyKeys;
    }

    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      if (key === '' || key.trim() === '') {
        emptyKeys.push({
          key: currentPath,
          message: 'Empty key detected',
          type: 'Empty Key',
          explanation: 'An object contains an empty key name, which may cause issues.',
          category: 'structure'
        });
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        findEmptyKeys(obj[key], currentPath, emptyKeys);
      }
    }
    return emptyKeys;
  };

  // Check for null/undefined misuse
  const findNullUndefinedIssues = (obj, path = '', issues = []) => {
    if (obj === null) {
      return issues;
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        if (value === undefined) {
          issues.push({
            key: currentPath,
            message: 'Undefined value detected',
            type: 'Undefined Value',
            explanation: `The key "${key}" has an undefined value. JSON does not support undefined - use null instead.`,
            category: 'structure'
          });
        }
        
        if (typeof value === 'object' && value !== null) {
          findNullUndefinedIssues(value, currentPath, issues);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (item === undefined) {
              issues.push({
                key: `${currentPath}[${index}]`,
                message: 'Undefined value in array',
                type: 'Undefined Value',
                explanation: `Array element at index ${index} is undefined. Use null instead.`,
                category: 'structure'
              });
            } else if (typeof item === 'object' && item !== null) {
              findNullUndefinedIssues(item, `${currentPath}[${index}]`, issues);
            }
          });
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (item === undefined) {
          issues.push({
            key: path ? `${path}[${index}]` : `[${index}]`,
            message: 'Undefined value in array',
            type: 'Undefined Value',
            explanation: `Array element at index ${index} is undefined. Use null instead.`,
            category: 'structure'
          });
        } else if (typeof item === 'object' && item !== null) {
          findNullUndefinedIssues(item, path ? `${path}[${index}]` : `[${index}]`, issues);
        }
      });
    }
    
    return issues;
  };

  // Check for deeply nested structures
  const checkNestingDepth = (obj, currentDepth = 0, maxDepth = 10, path = '', warnings = []) => {
    if (currentDepth > maxDepth) {
      warnings.push({
        key: path || 'root',
        message: `Deeply nested structure detected (depth: ${currentDepth})`,
        type: 'Deep Nesting',
        explanation: `The JSON structure is nested ${currentDepth} levels deep, which exceeds the recommended maximum of ${maxDepth}. This may cause performance issues.`,
        category: 'structure',
        depth: currentDepth
      });
      return warnings;
    }

    if (obj === null || typeof obj !== 'object') {
      return warnings;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          checkNestingDepth(item, currentDepth + 1, maxDepth, path ? `${path}[${index}]` : `[${index}]`, warnings);
        }
      });
    } else {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          checkNestingDepth(obj[key], currentDepth + 1, maxDepth, currentPath, warnings);
        }
      }
    }

    return warnings;
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

      // Check for empty keys if option is enabled
      if (checkEmptyKeys) {
        const emptyKeyErrors = findEmptyKeys(parsed);
        if (emptyKeyErrors.length > 0) {
          errors.push(...emptyKeyErrors);
        }
      }

      // Check for null/undefined misuse if option is enabled
      if (checkNullUndefined || strictMode) {
        const nullUndefinedIssues = findNullUndefinedIssues(parsed);
        if (nullUndefinedIssues.length > 0) {
          errors.push(...nullUndefinedIssues);
        }
      }

      // Check for deeply nested structures if option is enabled
      if (checkNesting) {
        const nestingWarnings = checkNestingDepth(parsed, 0, maxNestingDepth);
        if (nestingWarnings.length > 0) {
          errors.push(...nestingWarnings);
        }
      }

      // Strict mode checks
      if (strictMode) {
        // Additional strict mode validations can go here
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

      // Get error explanation
      const errorInfo = explainError(error.message);

      setStatus({ 
        type: 'invalid', 
        message: `✗ ${errorInfo.type}: ${errorInfo.explanation}`, 
        errors: [{
          line,
          column,
          message: error.message,
          type: errorInfo.type,
          explanation: errorInfo.explanation,
          category: errorInfo.category,
          position
        }]
      });
      if (setActive) {
        setActiveAction('validate');
        showToast(`Invalid JSON: ${errorInfo.explanation}`, 'error');
      }
      return false;
    }
  };

  // Jump to error location
  const jumpToError = (error) => {
    if (inputViewRef.current && error) {
      const doc = inputViewRef.current.state.doc;
      if (error.line) {
        const line = doc.line(error.line);
        const pos = line.from + Math.min(error.column || 0, line.length);
        inputViewRef.current.dispatch({
          selection: { anchor: pos, head: pos },
          effects: EditorView.scrollIntoView(pos, { y: 'center' }),
        });
        inputViewRef.current.focus();
      } else if (error.position) {
        const pos = Math.min(error.position, doc.length);
        inputViewRef.current.dispatch({
          selection: { anchor: pos, head: pos },
          effects: EditorView.scrollIntoView(pos, { y: 'center' }),
        });
        inputViewRef.current.focus();
      }
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
                <li 
                  key={index} 
                  style={{ 
                    marginBottom: 'var(--spacing-sm)',
                    cursor: (error.line || error.position) ? 'pointer' : 'default',
                    padding: 'var(--spacing-xs)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: (error.line || error.position) ? 'rgba(0,0,0,0.05)' : 'transparent',
                    transition: 'background-color var(--transition-base)'
                  }}
                  onClick={() => jumpToError(error)}
                  title={(error.line || error.position) ? 'Click to jump to error location' : ''}
                >
                  {error.type && <strong style={{ display: 'block', marginBottom: '2px' }}>{error.type}</strong>}
                  {error.line && <span style={{ color: 'var(--color-primary)' }}>Line {error.line}</span>}
                  {error.column && <span style={{ color: 'var(--color-primary)' }}>, Column {error.column}</span>}
                  {error.key && <span style={{ color: 'var(--color-text-secondary)' }}> - Key: "{error.key}"</span>}
                  {error.depth && <span style={{ color: 'var(--color-warning)' }}> - Depth: {error.depth}</span>}
                  <div style={{ marginTop: '4px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {error.explanation || error.message}
                  </div>
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
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="check-empty-keys"
                  checked={checkEmptyKeys}
                  onChange={(e) => setCheckEmptyKeys(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Detect Empty Keys</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="check-null-undefined"
                  checked={checkNullUndefined}
                  onChange={(e) => setCheckNullUndefined(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Detect Null/Undefined Misuse</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="check-nesting"
                  checked={checkNesting}
                  onChange={(e) => setCheckNesting(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Warn About Deep Nesting</span>
              </label>
              {checkNesting && (
                <div style={{ marginTop: 'var(--spacing-xs)', marginLeft: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '4px' }}>
                    Max Nesting Depth:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxNestingDepth}
                    onChange={(e) => setMaxNestingDepth(parseInt(e.target.value) || 10)}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.8125rem'
                    }}
                  />
                </div>
              )}
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

