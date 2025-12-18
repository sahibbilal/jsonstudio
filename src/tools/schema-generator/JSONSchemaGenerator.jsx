import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONSchemaGenerator = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [activeAction, setActiveAction] = useState('');
  const [detectRequired, setDetectRequired] = useState(true);
  const [detectOptional, setDetectOptional] = useState(true);
  const [inferDataTypes, setInferDataTypes] = useState(true);
  const [includeDescriptions, setIncludeDescriptions] = useState(false);
  const [strictTypes, setStrictTypes] = useState(false);
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
      setStats({ chars: 0, lines: 0, size: '0 KB' });
      return;
    }
    const chars = text.length;
    const lines = text.split('\n').length;
    const size = (chars / 1024).toFixed(2);
    setStats({ chars, lines, size: `${size} KB` });
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

  // Infer data type from value
  const inferType = (value, samples = []) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      if (value.length === 0) return { type: 'array', items: {} };
      const itemTypes = new Set();
      value.forEach(item => {
        if (item === null) itemTypes.add('null');
        else if (Array.isArray(item)) itemTypes.add('array');
        else if (typeof item === 'object') itemTypes.add('object');
        else itemTypes.add(typeof item);
      });
      if (itemTypes.size === 1) {
        const itemType = Array.from(itemTypes)[0];
        if (itemType === 'object' && value.length > 0) {
          return { type: 'array', items: generateSchema(value[0], samples) };
        }
        return { type: 'array', items: { type: itemType } };
      }
      return { type: 'array', items: {} };
    }
    if (typeof value === 'object' && value !== null) {
      return 'object';
    }
    return typeof value;
  };

  // Detect if field is required (present in all samples)
  const isRequired = (key, samples) => {
    if (!detectRequired || samples.length === 0) return false;
    return samples.every(sample => key in sample && sample[key] !== undefined);
  };

  // Detect if field is optional (missing in some samples)
  const isOptional = (key, samples) => {
    if (!detectOptional || samples.length === 0) return false;
    const presentCount = samples.filter(sample => key in sample && sample[key] !== undefined).length;
    return presentCount > 0 && presentCount < samples.length;
  };

  // Generate schema from JSON
  const generateSchema = (obj, samples = []) => {
    if (obj === null) {
      return { type: 'null' };
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return { type: 'array', items: {} };
      }
      const itemSchema = generateSchema(obj[0], samples.map(s => Array.isArray(s) ? s[0] : null).filter(Boolean));
      return { type: 'array', items: itemSchema };
    }

    if (typeof obj !== 'object') {
      const type = typeof obj;
      const schema = { type };
      
      if (strictTypes && type === 'number') {
        if (Number.isInteger(obj)) {
          schema.type = 'integer';
        }
      }
      
      if (includeDescriptions) {
        schema.description = `Value of type ${type}`;
      }
      
      return schema;
    }

    const schema = {
      type: 'object',
      properties: {},
    };

    if (detectRequired || detectOptional) {
      schema.required = [];
    }

    // Get all unique keys from samples
    const allKeys = new Set();
    if (samples.length > 0) {
      samples.forEach(sample => {
        if (typeof sample === 'object' && sample !== null) {
          Object.keys(sample).forEach(key => allKeys.add(key));
        }
      });
    } else {
      Object.keys(obj).forEach(key => allKeys.add(key));
    }

    allKeys.forEach(key => {
      const value = obj[key];
      const fieldSamples = samples.map(s => s && typeof s === 'object' ? s[key] : undefined).filter(v => v !== undefined);
      
      let propertySchema = generateSchema(value !== undefined ? value : null, fieldSamples);
      
      if (inferDataTypes && value !== undefined) {
        const inferred = inferType(value, fieldSamples);
        if (typeof inferred === 'string') {
          propertySchema.type = inferred;
        } else if (typeof inferred === 'object') {
          propertySchema = { ...propertySchema, ...inferred };
        }
      }

      if (includeDescriptions) {
        propertySchema.description = `Field: ${key}`;
      }

      schema.properties[key] = propertySchema;

      // Check if required
      if (detectRequired && isRequired(key, samples.length > 0 ? samples : [obj])) {
        if (!schema.required) schema.required = [];
        schema.required.push(key);
      }
    });

    return schema;
  };

  // Generate schema
  const generateSchemaFromJSON = () => {
    if (!parsedData) {
      showToast('Please enter valid JSON first', 'warning');
      return;
    }

    try {
      // Collect samples if it's an array
      let samples = [];
      let dataToAnalyze = parsedData;
      
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        samples = parsedData;
        dataToAnalyze = parsedData[0];
      } else {
        samples = [parsedData];
      }

      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        ...generateSchema(dataToAnalyze, samples),
      };

      const schemaString = JSON.stringify(schema, null, 2);
      setOutput(schemaString);
      
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: schemaString,
          },
        });
      }
      
      updateStats(schemaString);
      setActiveTab('output');
      setActiveAction('generate');
      showToast('Schema generated successfully!', 'success');
      setStatus({ type: 'valid', message: '✓ Schema generated' });
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
    <div className="json-schema-generator-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-xl)' }}>
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
                JSON Input
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
                Generated Schema
              </button>
            </div>
            <div className="tool-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-sm" 
                onClick={generateSchemaFromJSON} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'generate' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'generate' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Generate Schema
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
            Schema Options
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={detectRequired}
                  onChange={(e) => setDetectRequired(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Detect Required Fields</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={detectOptional}
                  onChange={(e) => setDetectOptional(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Detect Optional Fields</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inferDataTypes}
                  onChange={(e) => setInferDataTypes(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Infer Data Types</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDescriptions}
                  onChange={(e) => setIncludeDescriptions(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Include Descriptions</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={strictTypes}
                  onChange={(e) => setStrictTypes(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Strict Type Checking</span>
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
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Schema Generator Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            Generate JSON Schema from JSON data:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Automatically detects data types</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Identifies required and optional fields</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Supports nested objects and arrays</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Generates Draft 7 compatible schema</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONSchemaGenerator;

