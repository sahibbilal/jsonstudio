import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONQueryExtractor = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [activeAction, setActiveAction] = useState('');
  const [queryType, setQueryType] = useState('path'); // 'path', 'filter', 'subset'
  const [queryPath, setQueryPath] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [subsetFields, setSubsetFields] = useState('');
  const [outputFormat, setOutputFormat] = useState('json'); // 'json', 'table', 'list'
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB', results: 0 });
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
              updateStats(value, 'input');
              parseInput(value);
            }
          }),
        ],
      });

      inputViewRef.current = new EditorView({
        state: inputState,
        parent: inputEditorRef.current,
      });
      
      setTimeout(() => {
        if (inputViewRef.current) {
          inputViewRef.current.requestMeasure();
        }
      }, 100);
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
  const updateStats = (text, type = 'output') => {
    if (!text) {
      if (type === 'input') {
        setStats(prev => ({ ...prev, chars: 0, lines: 0, size: '0 KB' }));
      } else {
        setStats(prev => ({ ...prev, chars: 0, lines: 0, size: '0 KB', results: 0 }));
      }
      return;
    }
    const chars = text.length;
    const lines = text.split('\n').length;
    const size = (chars / 1024).toFixed(2);
    if (type === 'input') {
      setStats(prev => ({ ...prev, chars, lines, size: `${size} KB` }));
    } else {
      setStats(prev => ({ ...prev, chars, lines, size: `${size} KB` }));
    }
  };

  // Parse input JSON
  const parseInput = (text) => {
    if (!text.trim()) {
      setParsedData(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setParsedData(parsed);
      setStatus({ type: 'valid', message: '✓ Valid JSON' });
    } catch (error) {
      setParsedData(null);
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
    }
  };

  // Get value by path (supports dot notation and array indices)
  const getValueByPath = (obj, path) => {
    if (!path) return obj;
    
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

  // Filter array by condition
  const filterArray = (arr, condition) => {
    if (!Array.isArray(arr)) return [];
    
    try {
      // Simple condition parser: supports field comparisons
      // Examples: "age > 18", "name == 'John'", "status != 'active'"
      return arr.filter(item => {
        if (typeof item !== 'object' || item === null) return false;
        
        // Parse condition
        const operators = ['>=', '<=', '!=', '==', '>', '<'];
        let op = null;
        let field = '';
        let value = '';
        
        for (const operator of operators) {
          if (condition.includes(operator)) {
            op = operator;
            const parts = condition.split(operator).map(s => s.trim());
            field = parts[0];
            value = parts[1];
            break;
          }
        }
        
        if (!op || !field) return true; // No valid condition, return all
        
        // Get field value
        const fieldValue = getValueByPath(item, field);
        
        // Compare
        switch (op) {
          case '>':
            return Number(fieldValue) > Number(value);
          case '<':
            return Number(fieldValue) < Number(value);
          case '>=':
            return Number(fieldValue) >= Number(value);
          case '<=':
            return Number(fieldValue) <= Number(value);
          case '==':
            return String(fieldValue) === value.replace(/['"]/g, '');
          case '!=':
            return String(fieldValue) !== value.replace(/['"]/g, '');
          default:
            return true;
        }
      });
    } catch (error) {
      showToast(`Filter error: ${error.message}`, 'error');
      return [];
    }
  };

  // Extract subset of JSON
  const extractSubset = (obj, fields) => {
    if (!fields || !fields.trim()) return obj;
    
    const fieldList = fields.split(',').map(f => f.trim()).filter(f => f);
    if (fieldList.length === 0) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => extractSubset(item, fields));
    }
    
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const result = {};
    fieldList.forEach(field => {
      const value = getValueByPath(obj, field);
      if (value !== undefined) {
        // Set nested field
        const parts = field.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      }
    });
    
    return result;
  };

  // Format output based on format type
  const formatOutput = (data) => {
    if (outputFormat === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (outputFormat === 'table') {
      return formatAsTable(data);
    } else if (outputFormat === 'list') {
      return formatAsList(data);
    }
    return JSON.stringify(data, null, 2);
  };

  // Format as table
  const formatAsTable = (data) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      let table = keys.join(' | ') + '\n';
      table += keys.map(() => '---').join(' | ') + '\n';
      
      data.forEach(item => {
        const row = keys.map(key => {
          const value = item[key];
          return value === null || value === undefined ? '' : String(value);
        });
        table += row.join(' | ') + '\n';
      });
      
      return table;
    }
    return JSON.stringify(data, null, 2);
  };

  // Format as list
  const formatAsList = (data) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return `${index + 1}. ${JSON.stringify(item)}`;
        }
        return `${index + 1}. ${String(item)}`;
      }).join('\n');
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => {
        return `• ${key}: ${JSON.stringify(value)}`;
      }).join('\n');
    }
    return String(data);
  };

  // Execute query
  const executeQuery = () => {
    if (!parsedData) {
      showToast('Please enter valid JSON first', 'warning');
      return;
    }

    try {
      let result = null;

      if (queryType === 'path') {
        if (!queryPath.trim()) {
          showToast('Please enter a path', 'warning');
          return;
        }
        result = getValueByPath(parsedData, queryPath);
        if (result === undefined) {
          showToast('Path not found', 'warning');
          return;
        }
      } else if (queryType === 'filter') {
        if (!filterCondition.trim()) {
          showToast('Please enter a filter condition', 'warning');
          return;
        }
        if (!Array.isArray(parsedData)) {
          showToast('Filter works on arrays only', 'warning');
          return;
        }
        result = filterArray(parsedData, filterCondition);
      } else if (queryType === 'subset') {
        result = extractSubset(parsedData, subsetFields);
      }

      if (result === null || result === undefined) {
        showToast('No results found', 'warning');
        return;
      }

      const formatted = formatOutput(result);
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
      
      const resultCount = Array.isArray(result) ? result.length : 1;
      setStats(prev => ({ ...prev, results: resultCount }));
      updateStats(formatted);
      setActiveTab('output');
      setActiveAction('query');
      showToast('Query executed successfully!', 'success');
      setStatus({ type: 'valid', message: `✓ Found ${resultCount} result(s)` });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const textToCopy = activeTab === 'output' ? output : input;
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
    setParsedData(null);
    setStats({ chars: 0, lines: 0, size: '0 KB', results: 0 });
    setStatus({ type: '', message: '' });
    setActiveTab('input');
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
    <div className="json-query-extractor-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-xl)' }}>
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
                onClick={executeQuery} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'query' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'query' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Execute Query
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
              <span>{stats.chars.toLocaleString()} chars</span>
              <span>{stats.lines} lines</span>
              {stats.results > 0 && <span>{stats.results} results</span>}
            </div>
            <div className={`editor-status ${status.type ? `status-${status.type}` : ''}`} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {status.message}
            </div>
          </div>
        </div>
      </div>

      <aside className="tool-sidebar" style={{ flex: '0 0 350px', minWidth: '350px' }}>
        <div className="tool-options" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>
            Query Options
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="query-type" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Query Type
              </label>
              <select
                id="query-type"
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
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
                <option value="path">Path-based Query</option>
                <option value="filter">Filter Array</option>
                <option value="subset">Extract Subset</option>
              </select>
            </div>

            {queryType === 'path' && (
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="query-path" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  JSON Path
                </label>
                <input
                  id="query-path"
                  type="text"
                  placeholder="e.g., users[0].name or data.items"
                  value={queryPath}
                  onChange={(e) => setQueryPath(e.target.value)}
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
                <small style={{ display: 'block', marginTop: 'var(--spacing-xs)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Use dot notation: user.name or array[0]
                </small>
              </div>
            )}

            {queryType === 'filter' && (
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="filter-condition" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Filter Condition
                </label>
                <input
                  id="filter-condition"
                  type="text"
                  placeholder="e.g., age > 18 or status == 'active'"
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
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
                <small style={{ display: 'block', marginTop: 'var(--spacing-xs)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Operators: &gt;, &lt;, &gt;=, &lt;=, ==, !=
                </small>
              </div>
            )}

            {queryType === 'subset' && (
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="subset-fields" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Fields to Extract
                </label>
                <input
                  id="subset-fields"
                  type="text"
                  placeholder="e.g., name, age, email"
                  value={subsetFields}
                  onChange={(e) => setSubsetFields(e.target.value)}
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
                <small style={{ display: 'block', marginTop: 'var(--spacing-xs)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Comma-separated field names
                </small>
              </div>
            )}

            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="output-format" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Output Format
              </label>
              <select
                id="output-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
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
                <option value="json">JSON</option>
                <option value="table">Table</option>
                <option value="list">List</option>
              </select>
            </div>
          </div>
        </div>

        <div className="tool-info" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Query & Extract Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            Extract and query JSON data:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Path Query: Extract by JSON path</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Filter: Filter arrays by conditions</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Subset: Extract specific fields</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Output as JSON, Table, or List</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Copy results to clipboard</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONQueryExtractor;

