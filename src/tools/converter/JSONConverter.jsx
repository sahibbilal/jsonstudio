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
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB' });
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Custom mapping options
  const [fieldMapping, setFieldMapping] = useState({ include: [], exclude: [], rename: {} });
  const [flattenNested, setFlattenNested] = useState(false);
  const [normalizeArrays, setNormalizeArrays] = useState(false);
  const [showMappingPanel, setShowMappingPanel] = useState(false);

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

  // Convert JSON to Plain Text
  const jsonToPlainText = (obj, indent = 0, prefix = '') => {
    const spaces = '  '.repeat(indent);
    let text = '';

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          text += `${spaces}${prefix}[${index}]:\n`;
          text += jsonToPlainText(item, indent + 1, '');
        } else {
          text += `${spaces}${prefix}[${index}]: ${String(item)}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      keys.forEach((key, index) => {
        const value = obj[key];
        if (Array.isArray(value)) {
          text += `${spaces}${prefix}${key}:\n`;
          text += jsonToPlainText(value, indent + 1, '');
        } else if (typeof value === 'object' && value !== null) {
          text += `${spaces}${prefix}${key}:\n`;
          text += jsonToPlainText(value, indent + 1, '');
        } else {
          text += `${spaces}${prefix}${key}: ${String(value)}\n`;
        }
      });
    } else {
      text = `${spaces}${prefix}${String(obj)}\n`;
    }

    return text;
  };

  // Convert JSON to TOML
  const jsonToTOML = (obj, prefix = '') => {
    let toml = '';

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          toml += `[[${prefix || 'item'}]]\n`;
          toml += jsonToTOML(item, '');
        } else {
          toml += `${prefix || 'item'}[${index}] = ${formatTOMLValue(item)}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        const value = obj[key];
        const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key.replace(/"/g, '\\"')}"`;
        const fullKey = prefix ? `${prefix}.${safeKey}` : safeKey;

        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
            value.forEach((item) => {
              toml += `[[${fullKey}]]\n`;
              toml += jsonToTOML(item, '');
            });
          } else {
            toml += `${fullKey} = ${formatTOMLArray(value)}\n`;
          }
        } else if (typeof value === 'object' && value !== null) {
          toml += `[${fullKey}]\n`;
          toml += jsonToTOML(value, '');
        } else {
          toml += `${fullKey} = ${formatTOMLValue(value)}\n`;
        }
      });
    }

    return toml;
  };

  const formatTOMLValue = (value) => {
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'string') {
      return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return `"${String(value)}"`;
  };

  const formatTOMLArray = (arr) => {
    return '[' + arr.map(item => formatTOMLValue(item)).join(', ') + ']';
  };

  // Apply field mapping (include/exclude/rename)
  const applyFieldMapping = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => applyFieldMapping(item));
    }

    const result = {};
    const keys = Object.keys(obj);

    keys.forEach(key => {
      // Check exclude list
      if (fieldMapping.exclude.length > 0 && fieldMapping.exclude.includes(key)) {
        return;
      }

      // Check include list (if not empty, only include specified fields)
      if (fieldMapping.include.length > 0 && !fieldMapping.include.includes(key)) {
        return;
      }

      // Apply rename
      const newKey = fieldMapping.rename[key] || key;
      const value = obj[key];

      // Recursively apply mapping to nested objects
      if (typeof value === 'object' && value !== null) {
        result[newKey] = applyFieldMapping(value);
      } else {
        result[newKey] = value;
      }
    });

    return result;
  };

  // Flatten nested objects
  const flattenObject = (obj, prefix = '', result = {}) => {
    if (typeof obj !== 'object' || obj === null) {
      result[prefix || 'value'] = obj;
      return result;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
        flattenObject(item, newPrefix, result);
      });
      return result;
    }

    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayKey = `${newKey}[${index}]`;
          if (typeof item === 'object' && item !== null) {
            flattenObject(item, arrayKey, result);
          } else {
            result[arrayKey] = item;
          }
        });
      } else {
        result[newKey] = value;
      }
    });

    return result;
  };

  // Normalize arrays (convert arrays of objects to consistent structure)
  const applyArrayNormalization = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      // If array contains objects, ensure all objects have the same keys
      const objects = obj.filter(item => typeof item === 'object' && item !== null && !Array.isArray(item));
      if (objects.length > 0) {
        const allKeys = new Set();
        objects.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));

        return obj.map(item => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const normalized = {};
            allKeys.forEach(key => {
              normalized[key] = key in item ? applyArrayNormalization(item[key]) : null;
            });
            return normalized;
          }
          return applyArrayNormalization(item);
        });
      }
      return obj.map(item => applyArrayNormalization(item));
    }

    const result = {};
    Object.keys(obj).forEach(key => {
      result[key] = applyArrayNormalization(obj[key]);
    });
    return result;
  };

  // Extract all keys from JSON for mapping UI
  const extractKeys = (obj, prefix = '', keys = []) => {
    if (typeof obj !== 'object' || obj === null) {
      return keys;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
        extractKeys(obj[0], prefix, keys);
      }
      return keys;
    }

    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (!keys.includes(fullKey)) {
        keys.push(fullKey);
      }
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        extractKeys(obj[key], fullKey, keys);
      }
    });

    return keys;
  };

  // Convert JSON
  const convertJSON = () => {
    if (!input.trim()) {
      showToast('Please enter some JSON', 'warning');
      setActiveAction('');
      return;
    }

    try {
      let parsed = JSON.parse(input);

      // Apply custom mapping transformations
      if (fieldMapping.include.length > 0 || fieldMapping.exclude.length > 0 || Object.keys(fieldMapping.rename).length > 0) {
        parsed = applyFieldMapping(parsed);
      }

      if (flattenNested) {
        parsed = flattenObject(parsed);
      }

      if (normalizeArrays) {
        parsed = applyArrayNormalization(parsed);
      }

      let converted = '';

      switch (outputFormat) {
        case 'xml':
          converted = preserveStructure 
            ? `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${jsonToXML(parsed, 'root', 1)}</root>`
            : `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXML(parsed, 'root', 0)}`;
          break;
        case 'csv':
          converted = jsonToCSV(parsed);
          break;
        case 'yaml':
          converted = jsonToYAML(parsed);
          break;
        case 'text':
          converted = jsonToPlainText(parsed);
          break;
        case 'toml':
          converted = jsonToTOML(parsed);
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
                <option value="text">Plain Text</option>
                <option value="toml">TOML</option>
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
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="preserve-structure"
                  checked={preserveStructure}
                  onChange={(e) => setPreserveStructure(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Preserve Structure</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="flatten-nested"
                  checked={flattenNested}
                  onChange={(e) => setFlattenNested(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Flatten Nested Objects</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="normalize-arrays"
                  checked={normalizeArrays}
                  onChange={(e) => setNormalizeArrays(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Normalize Arrays</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <button
                onClick={() => setShowMappingPanel(!showMappingPanel)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: showMappingPanel ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: showMappingPanel ? '#fff' : 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                {showMappingPanel ? 'Hide' : 'Show'} Field Mapping
              </button>
            </div>
          </div>
        </div>

        {/* Field Mapping Panel */}
        {showMappingPanel && (
          <div className="tool-options" style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>
              Field Mapping
            </h3>
            <div className="options-content">
              {/* Include Fields */}
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Include Fields (leave empty for all)
                </label>
                <input
                  type="text"
                  placeholder="field1, field2, field3"
                  value={fieldMapping.include.join(', ')}
                  onChange={(e) => {
                    const fields = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                    setFieldMapping(prev => ({ ...prev, include: fields }));
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
                />
              </div>

              {/* Exclude Fields */}
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Exclude Fields
                </label>
                <input
                  type="text"
                  placeholder="field1, field2, field3"
                  value={fieldMapping.exclude.join(', ')}
                  onChange={(e) => {
                    const fields = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                    setFieldMapping(prev => ({ ...prev, exclude: fields }));
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
                />
              </div>

              {/* Rename Fields */}
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Rename Fields (oldName:newName, one per line)
                </label>
                <textarea
                  placeholder="oldName1:newName1&#10;oldName2:newName2"
                  value={Object.entries(fieldMapping.rename).map(([old, newName]) => `${old}:${newName}`).join('\n')}
                  onChange={(e) => {
                    const renameMap = {};
                    e.target.value.split('\n').forEach(line => {
                      const [old, newName] = line.split(':').map(s => s.trim());
                      if (old && newName) {
                        renameMap[old] = newName;
                      }
                    });
                    setFieldMapping(prev => ({ ...prev, rename: renameMap }));
                  }}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setFieldMapping({ include: [], exclude: [], rename: {} });
                }}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Reset Mapping
              </button>
            </div>
          </div>
        )}

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
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Plain Text - Human-readable format</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>TOML - Tom's Obvious Minimal Language</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Use Field Mapping to customize output</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Flatten nested objects for flat structures</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Normalize arrays for consistent schemas</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONConverter;

