import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONArrayConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [activeAction, setActiveAction] = useState('');
  const [conversionDirection, setConversionDirection] = useState('json-to-array'); // 'json-to-array' or 'array-to-json'
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

  // Convert JSON to Array format
  const jsonToArray = (jsonObj) => {
    if (Array.isArray(jsonObj)) {
      return jsonObj.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return Object.entries(item).map(([key, value]) => [key, value]);
        }
        return [index, item];
      });
    } else if (typeof jsonObj === 'object' && jsonObj !== null) {
      return Object.entries(jsonObj).map(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return [key, Object.entries(value)];
        } else if (Array.isArray(value)) {
          return [key, value.map((item, idx) => 
            typeof item === 'object' && item !== null 
              ? Object.entries(item) 
              : [idx, item]
          )];
        }
        return [key, value];
      });
    }
    return [[0, jsonObj]];
  };

  // Helper function to recursively convert array structures
  const convertArrayValue = (value) => {
    if (!Array.isArray(value)) {
      return value;
    }

    // Empty array
    if (value.length === 0) {
      return [];
    }

    // Check if it's a key-value pair structure
    const firstItem = value[0];
    if (Array.isArray(firstItem) && firstItem.length === 2) {
      if (typeof firstItem[0] === 'string') {
        // It's an object representation [["key", "value"], ...]
        const result = {};
        value.forEach((item) => {
          if (!Array.isArray(item) || item.length !== 2) {
            return;
          }
          const [key, val] = item;
          result[key] = convertArrayValue(val);
        });
        return result;
      } else if (typeof firstItem[0] === 'number') {
        // It's an array representation [[0, "value"], [1, "value"], ...]
        return value.map(([index, item]) => convertArrayValue(item));
      }
    }

    // Simple array - convert nested items
    return value.map(item => convertArrayValue(item));
  };

  // Convert Array format to JSON
  const arrayToJSON = (arrayData) => {
    if (!Array.isArray(arrayData)) {
      throw new Error('Input must be a valid array');
    }

    // Empty array
    if (arrayData.length === 0) {
      return [];
    }

    // Check if it's a key-value pair array (object representation)
    // Format: [["key1", "value1"], ["key2", "value2"], ...]
    const firstItem = arrayData[0];
    if (Array.isArray(firstItem) && firstItem.length === 2) {
      // Check if first element's first item is a string (likely a key)
      if (typeof firstItem[0] === 'string') {
        // It's an object representation - convert to object
        const result = {};
        arrayData.forEach((item) => {
          if (!Array.isArray(item) || item.length !== 2) {
            throw new Error('Invalid array format: expected [key, value] pairs');
          }
          const [key, value] = item;
          result[key] = convertArrayValue(value);
        });
        return result;
      } else if (typeof firstItem[0] === 'number') {
        // It's an array representation with indices
        // Format: [[0, "value1"], [1, "value2"], ...]
        return arrayData.map(([index, item]) => convertArrayValue(item));
      }
    }
    
    // Simple array - return as is (but convert nested structures recursively)
    return arrayData.map(item => convertArrayValue(item));
  };

  // Format array output
  const formatArrayOutput = (arrayData, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let output = '[\n';

    arrayData.forEach((item, index) => {
      if (Array.isArray(item)) {
        output += `${spaces}  [\n`;
        item.forEach(([key, value], idx) => {
          const isLast = idx === item.length - 1;
          const valueStr = typeof value === 'string' 
            ? `"${value.replace(/"/g, '\\"')}"` 
            : typeof value === 'object' && value !== null
            ? formatArrayOutput(value, indent + 2)
            : String(value);
          output += `${spaces}    [${typeof key === 'string' ? `"${key}"` : key}, ${valueStr}]${isLast ? '' : ','}\n`;
        });
        output += `${spaces}  ]${index === arrayData.length - 1 ? '' : ','}\n`;
      } else {
        output += `${spaces}  ${JSON.stringify(item)}${index === arrayData.length - 1 ? '' : ','}\n`;
      }
    });

    output += `${spaces}]`;
    return output;
  };

  // Convert
  const convert = () => {
    if (!input.trim()) {
      showToast('Please enter some data to convert', 'warning');
      setActiveAction('');
      return;
    }

    try {
      let converted = '';

      if (conversionDirection === 'json-to-array') {
        // JSON to Array
        const parsed = JSON.parse(input);
        const arrayData = jsonToArray(parsed);
        converted = formatArrayOutput(arrayData);
      } else {
        // Array to JSON
        // Try to parse as JSON array first
        let parsed;
        try {
          parsed = JSON.parse(input);
        } catch {
          // If JSON parse fails, try to clean and parse again
          const cleaned = input
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .trim();
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            throw new Error('Invalid array format. Please provide a valid JSON array.');
          }
        }
        const jsonObj = arrayToJSON(parsed);
        converted = JSON.stringify(jsonObj, null, 2);
      }

      setOutput(converted);
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: converted,
          },
        });
      }
      setActiveTab('output');
      setActiveAction('convert');
      showToast(`Converted successfully!`, 'success');
      updateStats(converted);
      setStatus({ type: 'valid', message: '✓ Converted successfully' });
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
    setStats({ chars: 0, lines: 0, size: '0 KB' });
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
    <div className="json-array-converter-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
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
                {conversionDirection === 'json-to-array' ? 'JSON Input' : 'Array Input'}
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
                {conversionDirection === 'json-to-array' ? 'Array Output' : 'JSON Output'}
              </button>
            </div>
            <div className="tool-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-sm" 
                onClick={convert} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'convert' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'convert' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Convert
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

      <aside className="tool-sidebar" style={{ flex: '0 0 300px', minWidth: '300px' }}>
        <div className="tool-options" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>
            Conversion Direction
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Convert
              </label>
              <select
                value={conversionDirection}
                onChange={(e) => {
                  setConversionDirection(e.target.value);
                  setInput('');
                  setOutput('');
                  setActiveTab('input');
                  setActiveAction('');
                }}
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
                <option value="json-to-array">JSON → Array</option>
                <option value="array-to-json">Array → JSON</option>
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
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Array Converter Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            Convert between JSON and Array formats:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>JSON → Array: Converts objects to key-value pairs</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Array → JSON: Converts key-value pairs back to objects</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Supports nested objects and arrays</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Preserves data structure</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONArrayConverter;

