import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap } from '@codemirror/commands';

const JSONMockDataGenerator = () => {
  const [schemaInput, setSchemaInput] = useState('');
  const [output, setOutput] = useState('');
  const [parsedSchema, setParsedSchema] = useState(null);
  const [activeTab, setActiveTab] = useState('schema');
  const [activeAction, setActiveAction] = useState('');
  const [recordCount, setRecordCount] = useState(10);
  const [realisticData, setRealisticData] = useState(true);
  const [useSeed, setUseSeed] = useState(false);
  const [seedValue, setSeedValue] = useState('12345');
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB', records: 0 });
  const [status, setStatus] = useState({ type: '', message: '' });

  const schemaEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const schemaViewRef = useRef(null);
  const outputViewRef = useRef(null);
  const seedRef = useRef(12345);

  // Seeded random number generator
  const seededRandom = () => {
    seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
    return seedRef.current / 233280;
  };

  // Initialize CodeMirror editors
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                   document.body.classList.contains('dark-mode');

    // Schema editor
    if (schemaEditorRef.current && !schemaViewRef.current) {
      const schemaState = EditorState.create({
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
              setSchemaInput(value);
              updateStats(value, 'input');
              parseSchema(value);
            }
          }),
        ],
      });

      schemaViewRef.current = new EditorView({
        state: schemaState,
        parent: schemaEditorRef.current,
      });
      
      setTimeout(() => {
        if (schemaViewRef.current) {
          schemaViewRef.current.requestMeasure();
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
      if (schemaViewRef.current) {
        schemaViewRef.current.destroy();
      }
      if (outputViewRef.current) {
        outputViewRef.current.destroy();
      }
    };
  }, []);

  // Update stats
  const updateStats = (text, type = 'output') => {
    if (!text) {
      setStats({ chars: 0, lines: 0, size: '0 KB', records: 0 });
      return;
    }
    const chars = text.length;
    const lines = text.split('\n').length;
    const size = (chars / 1024).toFixed(2);
    setStats(prev => ({ ...prev, chars, lines, size: `${size} KB` }));
  };

  // Parse schema JSON
  const parseSchema = (text) => {
    if (!text.trim()) {
      setParsedSchema(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setParsedSchema(parsed);
      setStatus({ type: 'valid', message: '✓ Valid Schema' });
    } catch (error) {
      setParsedSchema(null);
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
    }
  };

  // Generate realistic data based on field name and type
  const generateRealisticValue = (fieldName, type, schema) => {
    const name = fieldName.toLowerCase();
    
    if (realisticData) {
      // Email
      if (name.includes('email') || name.includes('mail')) {
        const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
        const domain = domains[Math.floor((useSeed ? seededRandom() : Math.random()) * domains.length)];
        const user = `user${Math.floor((useSeed ? seededRandom() : Math.random()) * 1000)}`;
        return `${user}@${domain}`;
      }
      
      // Name
      if (name.includes('name') && !name.includes('user') && !name.includes('file')) {
        const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        const firstName = firstNames[Math.floor((useSeed ? seededRandom() : Math.random()) * firstNames.length)];
        const lastName = lastNames[Math.floor((useSeed ? seededRandom() : Math.random()) * lastNames.length)];
        return name.includes('first') ? firstName : name.includes('last') ? lastName : `${firstName} ${lastName}`;
      }
      
      // Phone
      if (name.includes('phone') || name.includes('tel')) {
        return `+1-${Math.floor(200 + (useSeed ? seededRandom() : Math.random()) * 800)}-${Math.floor(100 + (useSeed ? seededRandom() : Math.random()) * 900)}-${Math.floor(1000 + (useSeed ? seededRandom() : Math.random()) * 9000)}`;
      }
      
      // URL
      if (name.includes('url') || name.includes('link') || name.includes('website')) {
        const domains = ['example.com', 'test.com', 'demo.org'];
        const domain = domains[Math.floor((useSeed ? seededRandom() : Math.random()) * domains.length)];
        const paths = ['page', 'article', 'post', 'item'];
        const path = paths[Math.floor((useSeed ? seededRandom() : Math.random()) * paths.length)];
        return `https://${domain}/${path}${Math.floor((useSeed ? seededRandom() : Math.random()) * 100)}`;
      }
      
      // Date
      if (name.includes('date') || name.includes('time')) {
        const now = Date.now();
        const daysAgo = Math.floor((useSeed ? seededRandom() : Math.random()) * 365);
        const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
        return name.includes('iso') || name.includes('utc') ? date.toISOString() : date.toLocaleDateString();
      }
      
      // Address
      if (name.includes('address') || name.includes('street')) {
        const streets = ['Main St', 'Oak Ave', 'Park Blvd', 'Elm St', 'First St'];
        const street = streets[Math.floor((useSeed ? seededRandom() : Math.random()) * streets.length)];
        const number = Math.floor(1 + (useSeed ? seededRandom() : Math.random()) * 9999);
        return `${number} ${street}`;
      }
      
      // City
      if (name.includes('city')) {
        const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
        return cities[Math.floor((useSeed ? seededRandom() : Math.random()) * cities.length)];
      }
      
      // Country
      if (name.includes('country')) {
        const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan'];
        return countries[Math.floor((useSeed ? seededRandom() : Math.random()) * countries.length)];
      }
      
      // Status
      if (name.includes('status')) {
        const statuses = ['active', 'inactive', 'pending', 'completed', 'cancelled'];
        return statuses[Math.floor((useSeed ? seededRandom() : Math.random()) * statuses.length)];
      }
      
      // ID
      if (name.includes('id') && type === 'string') {
        return `ID-${Math.floor(1000 + (useSeed ? seededRandom() : Math.random()) * 9000)}`;
      }
    }
    
    // Default generation based on type
    return generateValueByType(type, schema);
  };

  // Generate value by type
  const generateValueByType = (type, schema) => {
    if (Array.isArray(type)) {
      type = type[0];
    }
    
    switch (type) {
      case 'string':
        if (schema && schema.format) {
          switch (schema.format) {
            case 'email':
              return `user${Math.floor((useSeed ? seededRandom() : Math.random()) * 1000)}@example.com`;
            case 'date':
              return new Date().toISOString().split('T')[0];
            case 'date-time':
              return new Date().toISOString();
            case 'uri':
              return 'https://example.com';
            default:
              return `string${Math.floor((useSeed ? seededRandom() : Math.random()) * 1000)}`;
          }
        }
        return `string${Math.floor((useSeed ? seededRandom() : Math.random()) * 1000)}`;
      
      case 'number':
        if (schema && schema.minimum !== undefined && schema.maximum !== undefined) {
          const min = schema.minimum;
          const max = schema.maximum;
          return min + Math.floor((useSeed ? seededRandom() : Math.random()) * (max - min + 1));
        }
        return Math.floor((useSeed ? seededRandom() : Math.random()) * 1000);
      
      case 'integer':
        if (schema && schema.minimum !== undefined && schema.maximum !== undefined) {
          const min = schema.minimum;
          const max = schema.maximum;
          return min + Math.floor((useSeed ? seededRandom() : Math.random()) * (max - min + 1));
        }
        return Math.floor((useSeed ? seededRandom() : Math.random()) * 1000);
      
      case 'boolean':
        return (useSeed ? seededRandom() : Math.random()) > 0.5;
      
      case 'null':
        return null;
      
      case 'array':
        if (schema && schema.items) {
          const length = schema.minItems || 1;
          return Array.from({ length }, () => generateValueByType(schema.items.type || 'string', schema.items));
        }
        return [];
      
      case 'object':
        if (schema && schema.properties) {
          const obj = {};
          Object.keys(schema.properties).forEach(key => {
            const propSchema = schema.properties[key];
            obj[key] = generateRealisticValue(key, propSchema.type || 'string', propSchema);
          });
          return obj;
        }
        return {};
      
      default:
        return null;
    }
  };

  // Generate mock data from schema
  const generateMockData = () => {
    if (!parsedSchema) {
      showToast('Please enter valid schema first', 'warning');
      return;
    }

    try {
      // Initialize seed if using seed
      if (useSeed) {
        seedRef.current = parseInt(seedValue) || 12345;
      } else {
        seedRef.current = 12345; // Reset for non-seeded
      }

      const schema = parsedSchema;
      const results = [];

      for (let i = 0; i < recordCount; i++) {
        if (schema.type === 'array' && schema.items) {
          results.push(generateValueByType('object', schema.items));
        } else if (schema.type === 'object' && schema.properties) {
          const obj = {};
          Object.keys(schema.properties).forEach(key => {
            const propSchema = schema.properties[key];
            // Check if required
            const isRequired = schema.required && schema.required.includes(key);
            if (isRequired || (useSeed ? seededRandom() : Math.random()) > 0.1) {
              obj[key] = generateRealisticValue(key, propSchema.type || 'string', propSchema);
            }
          });
          results.push(obj);
        } else {
          results.push(generateValueByType(schema.type || 'object', schema));
        }
      }

      const outputData = schema.type === 'array' ? results : results[0];
      const outputString = JSON.stringify(outputData, null, 2);
      setOutput(outputString);
      
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: outputString,
          },
        });
      }
      
      setStats(prev => ({ ...prev, records: results.length }));
      updateStats(outputString);
      setActiveTab('output');
      setActiveAction('generate');
      showToast(`Generated ${results.length} record(s)!`, 'success');
      setStatus({ type: 'valid', message: `✓ Generated ${results.length} record(s)` });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      setStatus({ type: 'invalid', message: `✗ ${error.message}` });
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const textToCopy = activeTab === 'output' ? output : schemaInput;
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
    if (schemaViewRef.current) {
      schemaViewRef.current.dispatch({
        changes: {
          from: 0,
          to: schemaViewRef.current.state.doc.length,
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
    setSchemaInput('');
    setOutput('');
    setParsedSchema(null);
    setStats({ chars: 0, lines: 0, size: '0 KB', records: 0 });
    setStatus({ type: '', message: '' });
    setActiveTab('schema');
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
    <div className="json-mock-data-generator-app" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--spacing-xl)' }}>
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
                className={`tool-tab ${activeTab === 'schema' ? 'active' : ''}`}
                onClick={() => setActiveTab('schema')}
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)', 
                  border: 'none', 
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'schema' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'schema' ? '#fff' : 'var(--color-text)'
                }}
              >
                Schema Template
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
                Generated Data
              </button>
            </div>
            <div className="tool-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-sm" 
                onClick={generateMockData} 
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
                Generate
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
              ref={schemaEditorRef}
              className="json-editor-wrapper"
              style={{ 
                display: activeTab === 'schema' ? 'block' : 'none',
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
              {stats.records > 0 && <span>{stats.records} records</span>}
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
            Generation Options
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="record-count" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Number of Records
              </label>
              <input
                id="record-count"
                type="number"
                min="1"
                max="1000"
                value={recordCount}
                onChange={(e) => setRecordCount(parseInt(e.target.value) || 1)}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={realisticData}
                  onChange={(e) => setRealisticData(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Realistic Data Patterns</span>
              </label>
            </div>
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useSeed}
                  onChange={(e) => setUseSeed(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Use Seed (Repeatable)</span>
              </label>
            </div>
            {useSeed && (
              <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label htmlFor="seed-value" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Seed Value
                </label>
                <input
                  id="seed-value"
                  type="text"
                  value={seedValue}
                  onChange={(e) => setSeedValue(e.target.value)}
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
            )}
          </div>
        </div>

        <div className="tool-info" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Mock Data Generator Info</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
            Generate realistic mock JSON data:
          </p>
          <ul className="tips-list" style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Uses JSON Schema as template</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Generates realistic patterns</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Supports randomized values</li>
            <li style={{ marginBottom: 'var(--spacing-xs)' }}>Seed option for repeatable data</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default JSONMockDataGenerator;

