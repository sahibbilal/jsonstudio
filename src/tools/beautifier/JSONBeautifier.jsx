import React, { useState, useEffect, useRef } from 'react';
import { EditorView, lineNumbers, keymap, drawSelection, dropCursor, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { lintGutter, linter } from '@codemirror/lint';

const JSONBeautifier = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [activeAction, setActiveAction] = useState(''); // Track which action button is active
  const [indentSize, setIndentSize] = useState(4);
  const [indentType, setIndentType] = useState('space'); // 'space' or 'tab'
  const [sortKeys, setSortKeys] = useState(false);
  const [preserveKeyOrder, setPreserveKeyOrder] = useState(true);
  const [formatOnPaste, setFormatOnPaste] = useState(false);
  const [escapeUnicode, setEscapeUnicode] = useState(false);
  const [preserveStringFormatting, setPreserveStringFormatting] = useState(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0, size: '0 KB' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [lineWrap, setLineWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [fileInputRef, setFileInputRef] = useState(null);
  
  // Export options
  const [exportFilename, setExportFilename] = useState('json-data');
  const [exportEncoding, setExportEncoding] = useState('utf-8');
  const [lineEnding, setLineEnding] = useState('lf'); // 'lf', 'crlf', 'cr'
  const [showExportOptions, setShowExportOptions] = useState(false);

  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const inputViewRef = useRef(null);
  const outputViewRef = useRef(null);
  const containerRef = useRef(null);
  const fileInput = useRef(null);
  const inputLineWrapCompartment = useRef(new Compartment());
  const outputLineWrapCompartment = useRef(new Compartment());

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      if (ctrlKey && e.key === 'b') {
        e.preventDefault();
        beautifyJSON();
      } else if (ctrlKey && e.key === 'm') {
        e.preventDefault();
        minifyJSON();
      } else if (ctrlKey && e.key === 'v') {
        e.preventDefault();
        validateJSON(null, true);
      } else if (ctrlKey && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        copyToClipboard();
      } else if (ctrlKey && e.key === 's') {
        e.preventDefault();
        downloadAsFile(false);
      } else if (ctrlKey && e.key === '/') {
        e.preventDefault();
        // Toggle help/shortcuts - handled by AccessibilitySettings
      } else if (e.key === 'Escape') {
        setShowExportOptions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, output, lineEnding, exportFilename, exportEncoding]);

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
          bracketMatching(),
          foldGutter(),
          drawSelection(),
          dropCursor(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          lintGutter(),
          linter(jsonParseLinter()),
          keymap.of([...historyKeymap, ...defaultKeymap, ...foldKeymap]),
          inputLineWrapCompartment.current.of(lineWrap ? EditorView.lineWrapping : []),
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
    }

    // Output editor (read-only)
    if (outputEditorRef.current && !outputViewRef.current) {
      const outputState = EditorState.create({
        doc: '',
        extensions: [
          lineNumbers(),
          history(),
          json(),
          bracketMatching(),
          foldGutter(),
          drawSelection(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          keymap.of([...historyKeymap, ...defaultKeymap, ...foldKeymap]),
          outputLineWrapCompartment.current.of(lineWrap ? EditorView.lineWrapping : []),
          isDark ? oneDark : [],
          EditorView.editable.of(false),
        ],
      });

      outputViewRef.current = new EditorView({
        state: outputState,
        parent: outputEditorRef.current,
      });
      
      // Force refresh after a short delay to ensure proper rendering
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

  // Handle paste with format on paste
  useEffect(() => {
    if (!inputViewRef.current || !formatOnPaste) return;

    const editorElement = inputEditorRef.current?.querySelector('.cm-editor') || inputEditorRef.current;
    if (!editorElement) return;

    const handlePasteEvent = (e) => {
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      if (pastedText.trim().startsWith('{') || pastedText.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(pastedText);
          let formatted = parsed;
          if (sortKeys && !preserveKeyOrder) {
            formatted = sortObjectKeys(parsed);
          }
          const indent = indentType === 'tab' ? '\t' : parseInt(indentSize, 10);
          const formattedText = JSON.stringify(formatted, null, indent);
          e.preventDefault();
          if (inputViewRef.current) {
            const view = inputViewRef.current;
            const selection = view.state.selection.main;
            view.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: formattedText,
              },
              selection: { anchor: selection.from + formattedText.length },
            });
          }
          showToast('JSON formatted on paste!', 'success');
        } catch (error) {
          // Allow normal paste if not valid JSON
        }
      }
    };

    editorElement.addEventListener('paste', handlePasteEvent);
    return () => {
      editorElement.removeEventListener('paste', handlePasteEvent);
    };
  }, [formatOnPaste, sortKeys, preserveKeyOrder, indentType, indentSize]);

  // Update line wrap when toggle changes
  useEffect(() => {
    if (inputViewRef.current) {
      inputViewRef.current.dispatch({
        effects: inputLineWrapCompartment.current.reconfigure(
          lineWrap ? EditorView.lineWrapping : []
        ),
      });
    }
    if (outputViewRef.current) {
      outputViewRef.current.dispatch({
        effects: outputLineWrapCompartment.current.reconfigure(
          lineWrap ? EditorView.lineWrapping : []
        ),
      });
    }
  }, [lineWrap]);

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

  // Validate JSON with error prevention warnings
  const validateJSON = (text = null, setActive = false) => {
    const jsonText = text !== null ? text : input;
    
    if (!jsonText.trim()) {
      setStatus({ type: '', message: '' });
      setErrors([]);
      if (setActive) {
        setActiveAction('');
        showToast('Please enter some JSON to validate', 'warning');
      }
      return false;
    }

    // Error prevention: Check for common issues before parsing
    const warnings = [];
    const trimmed = jsonText.trim();
    
    if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      warnings.push('Warning: JSON object may be incomplete (missing closing brace)');
    }
    if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
      warnings.push('Warning: JSON array may be incomplete (missing closing bracket)');
    }
    if ((jsonText.match(/{/g) || []).length !== (jsonText.match(/}/g) || []).length) {
      warnings.push('Warning: Mismatched braces detected');
    }
    if ((jsonText.match(/\[/g) || []).length !== (jsonText.match(/\]/g) || []).length) {
      warnings.push('Warning: Mismatched brackets detected');
    }
    if (jsonText.includes('undefined')) {
      warnings.push('Warning: "undefined" is not valid JSON. Use null instead.');
    }
    if (jsonText.match(/[']/) && !jsonText.match(/['].*[']/)) {
      warnings.push('Warning: Single quotes are not valid JSON. Use double quotes for strings.');
    }
    if (jsonText.match(/,\s*[,}]/)) {
      warnings.push('Warning: Trailing commas detected. Remove commas before closing braces/brackets.');
    }

    try {
      JSON.parse(jsonText);
      setStatus({ type: 'valid', message: '✓ Valid JSON' });
      setErrors([]);
      if (warnings.length > 0 && setActive) {
        showToast(`Valid JSON, but ${warnings.length} warning(s) detected`, 'warning');
      }
      if (setActive) {
        setActiveAction('validate');
        if (warnings.length === 0) {
          showToast('JSON is valid!', 'success');
        }
      }
      return true;
    } catch (error) {
      const errorMessage = error.message;
      setStatus({ type: 'invalid', message: `✗ ${errorMessage}` });
      
      // Parse error position from message
      const positionMatch = errorMessage.match(/position (\d+)/);
      let errorLine = 0;
      let errorCol = 0;
      
      if (positionMatch) {
        const position = parseInt(positionMatch[1]);
        const lines = jsonText.substring(0, position).split('\n');
        errorLine = lines.length - 1;
        errorCol = lines[lines.length - 1].length;
      }
      
      // Combine error with warnings
      const allMessages = warnings.length > 0 
        ? `${errorMessage} (Also: ${warnings.join('; ')})`
        : errorMessage;
      
      setErrors([{
        line: errorLine,
        column: errorCol,
        message: allMessages,
        position: positionMatch ? parseInt(positionMatch[1]) : 0
      }]);
      
      if (setActive) {
        setActiveAction('');
        showToast(`Invalid JSON: ${errorMessage}`, 'error');
      }
      return false;
    }
  };

  // Jump to error location
  const jumpToError = (error) => {
    if (inputViewRef.current && error) {
      const doc = inputViewRef.current.state.doc;
      const line = doc.line(error.line + 1);
      const pos = line.from + Math.min(error.column, line.length);
      
      inputViewRef.current.dispatch({
        selection: { anchor: pos, head: pos },
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      });
      inputViewRef.current.focus();
      setActiveTab('input');
    }
  };

  // Recursively sort object keys
  const sortObjectKeys = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sortObjectKeys(item));
    }

    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
  };

  // Beautify JSON
  const beautifyJSON = () => {
    if (!input.trim()) {
      showToast('Please enter some JSON', 'warning');
      setActiveAction('');
      return;
    }

    try {
      let parsed = JSON.parse(input);
      
      // Sort keys recursively if option is enabled (and preserve key order is disabled)
      if (sortKeys && !preserveKeyOrder) {
        parsed = sortObjectKeys(parsed);
      }

      // Determine indent character
      const indent = indentType === 'tab' ? '\t' : parseInt(indentSize, 10);
      
      // Use replacer to preserve string formatting if needed
      const replacer = preserveStringFormatting ? null : undefined;
      const formatted = JSON.stringify(parsed, replacer, indent);

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
      setActiveTab('output');
      setActiveAction('beautify');
      showToast('JSON beautified successfully!', 'success');
      updateStats(formatted);
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      validateJSON(input, false);
    }
  };

  // Minify JSON - removes whitespace, line breaks, produces one-line output
  const minifyJSON = () => {
    if (!input.trim()) {
      showToast('Please enter some JSON', 'warning');
      setActiveAction('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      // JSON.stringify with no spacing removes all whitespace and line breaks
      // This produces a one-line output
      // String formatting is preserved by default (JSON.stringify maintains string content)
      const minified = JSON.stringify(parsed);
      
      setOutput(minified);
      if (outputViewRef.current) {
        outputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: outputViewRef.current.state.doc.length,
            insert: minified,
          },
        });
      }
      setActiveTab('output');
      setActiveAction('minify');
      showToast('JSON minified successfully!', 'success');
      updateStats(minified);
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
      setActiveAction('');
      validateJSON(input, false);
    }
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
    const text = output || input;
    if (!text) {
      showToast('No content to copy', 'warning');
      return;
    }

    const normalized = normalizeLineEndings(text);
    navigator.clipboard.writeText(normalized).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  // Download as file
  const downloadAsFile = async (compress = false) => {
    const text = output || input;
    if (!text) {
      showToast('No content to download', 'warning');
      return;
    }

    const normalized = normalizeLineEndings(text);
    const filename = exportFilename || 'json-data';
    const extension = compress ? 'json.gz' : 'json';
    const fullFilename = filename.endsWith('.json') ? (compress ? filename.replace('.json', '.json.gz') : filename) : `${filename}.${extension}`;

    if (compress) {
      try {
        // Use CompressionStream API if available (Chrome 80+)
        if (window.CompressionStream) {
          const stream = new Blob([normalized]).stream();
          const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
          const compressedBlob = await new Response(compressedStream).blob();
          
          const url = URL.createObjectURL(compressedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fullFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('File downloaded (compressed)!', 'success');
        } else {
          showToast('Compression not supported in this browser. Downloading uncompressed.', 'warning');
          downloadAsFile(false);
        }
      } catch (error) {
        showToast('Compression failed. Downloading uncompressed.', 'warning');
        downloadAsFile(false);
      }
    } else {
      // Create blob with proper encoding
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

  // Clear editors with confirmation
  const clearEditors = () => {
    if (confirm('Are you sure you want to clear the editor?')) {
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
      setErrors([]);
      setActiveTab('input');
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && !file.type.includes('json')) {
      showToast('Please upload a JSON file', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (inputViewRef.current) {
        inputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: inputViewRef.current.state.doc.length,
            insert: content,
          },
        });
      }
      setInput(content);
      updateStats(content);
      validateJSON(content, false);
      showToast('File loaded successfully!', 'success');
    };
    reader.onerror = () => {
      showToast('Error reading file', 'error');
    };
    reader.readAsText(file);
    
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '';

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && !file.type.includes('json')) {
      showToast('Please drop a JSON file', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (inputViewRef.current) {
        inputViewRef.current.dispatch({
          changes: {
            from: 0,
            to: inputViewRef.current.state.doc.length,
            insert: content,
          },
        });
      }
      setInput(content);
      updateStats(content);
      validateJSON(content, false);
      showToast('File loaded successfully!', 'success');
    };
    reader.onerror = () => {
      showToast('Error reading file', 'error');
    };
    reader.readAsText(file);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current?.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current?.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current?.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement || 
                        document.mozFullScreenElement || document.msFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`json-beautifier-app ${isFullscreen ? 'fullscreen' : ''}`}
      style={{ 
        width: '100%', 
        maxWidth: '100%', 
        boxSizing: 'border-box', 
        display: 'grid', 
        gridTemplateColumns: '1fr 300px', 
        gap: 'var(--spacing-xl)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        backgroundColor: isFullscreen ? 'var(--color-bg)' : 'transparent',
        padding: isFullscreen ? 'var(--spacing-lg)' : 0,
        height: isFullscreen ? '100vh' : 'auto'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button 
                className="btn btn-sm" 
                onClick={() => fileInput.current?.click()}
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
                title="Upload JSON file"
              >
                📁 Upload
              </button>
              <button 
                className="btn btn-sm" 
                onClick={beautifyJSON} 
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'beautify' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'beautify' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Beautify
              </button>
              <button 
                className="btn btn-sm" 
                onClick={minifyJSON}
                aria-label="Minify JSON (Ctrl+M or Cmd+M)"
                title="Minify JSON (Ctrl+M / Cmd+M)"
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: activeAction === 'minify' ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: activeAction === 'minify' ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                Minify
              </button>
              <button 
                className="btn btn-sm" 
                onClick={() => validateJSON(null, true)}
                aria-label="Validate JSON (Ctrl+V or Cmd+V)"
                title="Validate JSON (Ctrl+V / Cmd+V)"
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
                onClick={copyToClipboard}
                aria-label="Copy to clipboard (Ctrl+C or Cmd+C)"
                title="Copy to clipboard (Ctrl+C / Cmd+C)"
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
                onClick={() => setLineWrap(!lineWrap)}
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: lineWrap ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: lineWrap ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
                title="Toggle line wrapping"
                aria-label="Toggle line wrapping"
              >
                {lineWrap ? '📄 Wrap' : '📄 No Wrap'}
              </button>
              <button 
                className="btn btn-sm" 
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen mode"
                title="Toggle fullscreen mode"
                style={{ 
                  padding: 'var(--spacing-xs) var(--spacing-md)', 
                  borderRadius: 'var(--radius-2xl)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: isFullscreen ? 'var(--color-primary)' : 'var(--color-bg-secondary)', 
                  color: isFullscreen ? '#fff' : 'var(--color-text)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all var(--transition-base)'
                }}
              >
                {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
              </button>
              <button 
                className="btn btn-sm" 
                onClick={clearEditors}
                aria-label="Clear editor"
                title="Clear editor" 
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
              id="input-editor-panel"
              className="json-editor-wrapper"
              role="tabpanel"
              aria-labelledby="input-tab"
              aria-hidden={activeTab !== 'input'}
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
              id="output-editor-panel"
              className="json-editor-wrapper"
              role="tabpanel"
              aria-labelledby="output-tab"
              aria-hidden={activeTab !== 'output'}
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
          {errors.length > 0 && (
            <div className="error-summary-panel" style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-error-bg, #fee)',
              borderTop: '1px solid var(--color-error, #f00)',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-error, #f00)' }}>
                Errors ({errors.length})
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
                {errors.map((error, idx) => (
                  <li key={idx} style={{ marginBottom: 'var(--spacing-xs)', cursor: 'pointer' }} onClick={() => jumpToError(error)}>
                    Line {error.line + 1}, Column {error.column + 1}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <aside className="tool-sidebar">
        <div className="tool-options" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>Formatting Options</h3>
          <div className="options-content">
            <div className="option-group">
              <label htmlFor="indent-type">Indent Type</label>
              <select
                id="indent-type"
                className="option-select"
                value={indentType}
                onChange={(e) => setIndentType(e.target.value)}
              >
                <option value="space">Spaces</option>
                <option value="tab">Tab</option>
              </select>
            </div>
            {indentType === 'space' && (
              <div className="option-group">
                <label htmlFor="indent-size">Indent Size</label>
                <select
                  id="indent-size"
                  className="option-select"
                  value={indentSize}
                  onChange={(e) => setIndentSize(e.target.value)}
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="8">8 spaces</option>
                </select>
              </div>
            )}
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="preserve-key-order"
                  checked={preserveKeyOrder}
                  onChange={(e) => setPreserveKeyOrder(e.target.checked)}
                />
                Preserve Key Order
              </label>
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="sort-keys"
                  checked={sortKeys}
                  onChange={(e) => setSortKeys(e.target.checked)}
                  disabled={preserveKeyOrder}
                />
                Sort Keys Alphabetically
              </label>
              {preserveKeyOrder && (
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                  Disable "Preserve Key Order" to enable sorting
                </small>
              )}
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="format-on-paste"
                  checked={formatOnPaste}
                  onChange={(e) => setFormatOnPaste(e.target.checked)}
                />
                Format on Paste
              </label>
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="preserve-string-formatting"
                  checked={preserveStringFormatting}
                  onChange={(e) => setPreserveStringFormatting(e.target.checked)}
                />
                Preserve String Formatting
              </label>
              <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                Maintains original string content (default: enabled)
              </small>
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="escape-unicode"
                  checked={escapeUnicode}
                  onChange={(e) => setEscapeUnicode(e.target.checked)}
                />
                Escape Unicode Characters
              </label>
            </div>
          </div>
        </div>

        <div className="tool-options" style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 className="options-title" style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>
            Export Options
          </h3>
          <div className="options-content">
            <div className="option-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label htmlFor="export-filename" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Filename
              </label>
              <input
                id="export-filename"
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
              <label htmlFor="export-encoding" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Encoding
              </label>
              <select
                id="export-encoding"
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
              <label htmlFor="line-ending" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: 500 }}>
                Line Ending
              </label>
              <select
                id="line-ending"
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
          </div>
        </div>

        <div className="tool-info" role="complementary" aria-label="Tool information and tips">
          <h3>Tips & Help</h3>
          <ul className="tips-list" role="list">
            <li>Paste or type JSON in the input editor</li>
            <li>Click Beautify to format with proper indentation</li>
            <li>Click Minify to compress JSON to a single line</li>
            <li>Use Validate to check JSON syntax</li>
            <li>Export options control filename, encoding, and line endings</li>
            <li>Use keyboard shortcuts for faster workflow (see accessibility button)</li>
          </ul>
          
          <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: '0.875rem', fontWeight: 600 }}>Inline Documentation</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <strong>JSON Format:</strong> Valid JSON must use double quotes for strings, no trailing commas, and proper bracket/brace matching.
            </p>
            <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <strong>Error Prevention:</strong> The validator checks for common issues like undefined values, single quotes, and mismatched brackets before parsing.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default JSONBeautifier;

