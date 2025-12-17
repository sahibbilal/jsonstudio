import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [activeAction, setActiveAction] = useState('');
  const [outputFormat, setOutputFormat] = useState('xml');
  const [prettyPrint, setPrettyPrint] = useState(true);
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

  // Convert JSON to XML
  const jsonToXML = (obj, root = 'root', indent = 0) => {
    const spaces = '  '.repeat(indent);
    let xml = '';

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        xml += `${spaces}<item index="${index}">\n`;
        xml += jsonToXML(item, root, indent + 1);
        xml += `${spaces}</item>\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        const value = obj[key];
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        
        if (Array.isArray(value)) {
          xml += `${spaces}<${safeKey}>\n`;
          value.forEach((item, index) => {
            xml += `${spaces}  <item index="${index}">\n`;
            xml += jsonToXML(item, root, indent + 2);
            xml += `${spaces}  </item>\n`;
          });
          xml += `${spaces}</${safeKey}>\n`;
        } else if (typeof value === 'object' && value !== null) {
          xml += `${spaces}<${safeKey}>\n`;
          xml += jsonToXML(value, root, indent + 1);
          xml += `${spaces}</${safeKey}>\n`;
        } else {
          const escapedValue = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
          xml += `${spaces}<${safeKey}>${escapedValue}</${safeKey}>\n`;
        }
      }
    } else {
      const escapedValue = String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      xml = `${spaces}${escapedValue}\n`;
    }

    return xml;
  };

  // Convert JSON to CSV
  const jsonToCSV = (obj) => {
    if (Array.isArray(obj) && obj.length === 0) {
      return '';
    }

    if (Array.isArray(obj)) {
      // Get all unique keys from all objects
      const allKeys = new Set();
      obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      const keys = Array.from(allKeys);
      if (keys.length === 0) {
        return '';
      }

      // Header row
      let csv = keys.map(key => `"${key.replace(/"/g, '""')}"`).join(',') + '\n';

      // Data rows
      obj.forEach(item => {
        const row = keys.map(key => {
          const value = item && typeof item === 'object' ? item[key] : '';
          if (value === null || value === undefined) {
            return '""';
          }
          const strValue = String(value).replace(/"/g, '""');
          return `"${strValue}"`;
        });
        csv += row.join(',') + '\n';
      });

      return csv;
    } else if (typeof obj === 'object' && obj !== null) {
      // Single object - create header and one row
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return '';
      }

      let csv = keys.map(key => `"${key.replace(/"/g, '""')}"`).join(',') + '\n';
      const row = keys.map(key => {
        const value = obj[key];
        if (value === null || value === undefined) {
          return '""';
        }
        const strValue = String(value).replace(/"/g, '""');
        return `"${strValue}"`;
      });
      csv += row.join(',') + '\n';

      return csv;
    }

    return String(obj);
  };

  // Convert JSON to YAML
  const jsonToYAML = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          yaml += `${spaces}- `;
          const itemYaml = jsonToYAML(item, indent + 1);
          yaml += itemYaml.replace(/^  /, '');
        } else {
          yaml += `${spaces}- ${formatYAMLValue(item)}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        const value = obj[key];
        const isLast = index === keys.length - 1;

        if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          yaml += jsonToYAML(value, indent + 1);
        } else if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n`;
          yaml += jsonToYAML(value, indent + 1);
        } else {
          yaml += `${spaces}${key}: ${formatYAMLValue(value)}\n`;
        }
      });
    } else {
      yaml = `${spaces}${formatYAMLValue(obj)}\n`;
    }

    return yaml;
  };

  const formatYAMLValue = (value) => {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      // Check if string needs quotes
      if (value.includes(':') || value.includes('|') || value.includes('&') || value.includes('*') || value.includes('#') || value.includes('!')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  };

  // Convert JSON
  const convertJSON = () => {
    if (!input.trim()) {
      showToast('Please enter some JSON', 'warning');
      setActiveAction('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      let converted = '';

      switch (outputFormat) {
        case 'xml':
          converted = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${jsonToXML(parsed, 'root', 1)}</root>`;
          break;
        case 'csv':
          converted = jsonToCSV(parsed);
          break;
        case 'yaml':
          converted = jsonToYAML(parsed);
          break;
        default:
          converted = JSON.stringify(parsed, null, prettyPrint ? 2 : 0);
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
      showToast(`Converted to ${outputFormat.toUpperCase()} successfully!`, 'success');
      updateStats(converted);
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
    <div className="json-converter-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
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
                onClick={convertJSON} 
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
            Conversion Options
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="output-format" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Output Format
              </label>
              <select
                id="output-format"
                className="option-select"
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
                <option value="xml">XML</option>
                <option value="csv">CSV</option>
                <option value="yaml">YAML</option>
              </select>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="pretty-print"
                  checked={prettyPrint}
                  onChange={(e) => setPrettyPrint(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Pretty Print</span>
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
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Converter Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            Convert JSON to various formats:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>XML - Extensible Markup Language</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>CSV - Comma Separated Values</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>YAML - YAML Ain't Markup Language</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONConverter;

