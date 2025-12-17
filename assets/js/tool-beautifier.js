/**
 * JSON Beautifier & Minifier Tool
 * Client-side JSON formatting and minification
 */

(function() {
	'use strict';

	let inputEditor, outputEditor;
	let isInitialized = false;

	// Initialize CodeMirror editors
	function initEditors() {
		if (isInitialized) return;
		
		// Check if CodeMirror is available
		if (typeof CodeMirror === 'undefined') {
			// Fallback to textarea if CodeMirror not loaded
			initTextareaEditors();
			return;
		}

		const inputElement = document.getElementById('input-editor');
		const outputElement = document.getElementById('output-editor');

		if (!inputElement || !outputElement) return;

		// Input editor
		inputEditor = CodeMirror(inputElement, {
			value: '',
			mode: 'application/json',
			theme: getEditorTheme(),
			lineNumbers: true,
			lineWrapping: true,
			indentUnit: 4,
			indentWithTabs: false,
			autofocus: true,
			placeholder: 'Paste your JSON here...',
		});

		// Output editor (read-only)
		outputEditor = CodeMirror(outputElement, {
			value: '',
			mode: 'application/json',
			theme: getEditorTheme(),
			lineNumbers: true,
			lineWrapping: true,
			readOnly: true,
			placeholder: 'Formatted JSON will appear here...',
		});

		// Update stats on input change
		inputEditor.on('change', updateStats);
		inputEditor.on('change', debounce(validateJSON, 300));

		// Handle tab switching
		document.querySelectorAll('.tool-tab').forEach(tab => {
			tab.addEventListener('click', function() {
				const tabName = this.getAttribute('data-tab');
				switchTab(tabName);
			});
		});

		isInitialized = true;
	}

	// Fallback textarea editors
	function initTextareaEditors() {
		const inputElement = document.getElementById('input-editor');
		const outputElement = document.getElementById('output-editor');

		if (!inputElement || !outputElement) return;

		const inputTextarea = document.createElement('textarea');
		inputTextarea.id = 'input-textarea';
		inputTextarea.className = 'json-editor-textarea';
		inputTextarea.placeholder = 'Paste your JSON here...';
		inputTextarea.spellcheck = false;
		inputElement.appendChild(inputTextarea);

		const outputTextarea = document.createElement('textarea');
		outputTextarea.id = 'output-textarea';
		outputTextarea.className = 'json-editor-textarea';
		outputTextarea.readOnly = true;
		outputTextarea.placeholder = 'Formatted JSON will appear here...';
		outputElement.appendChild(outputTextarea);

		inputTextarea.addEventListener('input', updateStats);
		inputTextarea.addEventListener('input', debounce(validateJSON, 300));
	}

	// Get editor theme based on dark mode
	function getEditorTheme() {
		const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
		              document.body.classList.contains('dark-mode');
		return isDark ? 'material-darker' : 'default';
	}

	// Switch between input/output tabs
	function switchTab(tabName) {
		const tabs = document.querySelectorAll('.tool-tab');
		const inputWrapper = document.getElementById('input-editor').parentElement;
		const outputWrapper = document.getElementById('output-editor').parentElement;

		tabs.forEach(tab => {
			if (tab.getAttribute('data-tab') === tabName) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		});

		if (tabName === 'input') {
			inputWrapper.style.display = 'block';
			outputWrapper.style.display = 'none';
			if (inputEditor) inputEditor.refresh();
		} else {
			inputWrapper.style.display = 'none';
			outputWrapper.style.display = 'block';
			if (outputEditor) outputEditor.refresh();
		}
	}

	// Get input value
	function getInputValue() {
		if (inputEditor) {
			return inputEditor.getValue();
		}
		const textarea = document.getElementById('input-textarea');
		return textarea ? textarea.value : '';
	}

	// Set output value
	function setOutputValue(value) {
		if (outputEditor) {
			outputEditor.setValue(value);
			outputEditor.refresh();
		} else {
			const textarea = document.getElementById('output-textarea');
			if (textarea) textarea.value = value;
		}
	}

	// Update character/line count
	function updateStats() {
		const input = getInputValue();
		const charCount = input.length;
		const lineCount = input.split('\n').length;
		const sizeKB = (charCount / 1024).toFixed(2);

		const charCountEl = document.getElementById('char-count');
		const lineCountEl = document.getElementById('line-count');
		const sizeInfoEl = document.getElementById('size-info');

		if (charCountEl) charCountEl.textContent = `${charCount.toLocaleString()} characters`;
		if (lineCountEl) lineCountEl.textContent = `${lineCount} lines`;
		if (sizeInfoEl) sizeInfoEl.textContent = `${sizeKB} KB`;
	}

	// Validate JSON
	function validateJSON() {
		const input = getInputValue().trim();
		const statusEl = document.getElementById('editor-status');

		if (!input) {
			if (statusEl) statusEl.textContent = '';
			return true;
		}

		try {
			JSON.parse(input);
			if (statusEl) {
				statusEl.textContent = '✓ Valid JSON';
				statusEl.className = 'editor-status status-valid';
			}
			return true;
		} catch (error) {
			if (statusEl) {
				statusEl.textContent = `✗ ${error.message}`;
				statusEl.className = 'editor-status status-invalid';
			}
			return false;
		}
	}

	// Beautify JSON
	function beautifyJSON() {
		const input = getInputValue().trim();
		
		if (!input) {
			showToast('Please enter some JSON', 'warning');
			return;
		}

		try {
			const parsed = JSON.parse(input);
			const indentSize = document.getElementById('indent-size').value;
			const indent = indentSize === '\\t' ? '\t' : parseInt(indentSize, 10);
			const sortKeys = document.getElementById('sort-keys').checked;
			
			let formatted;
			if (sortKeys) {
				formatted = JSON.stringify(parsed, Object.keys(parsed).sort(), indent);
			} else {
				formatted = JSON.stringify(parsed, null, indent);
			}

			setOutputValue(formatted);
			switchTab('output');
			showToast('JSON beautified successfully!', 'success');
			updateStats();
		} catch (error) {
			showToast(`Error: ${error.message}`, 'error');
			validateJSON();
		}
	}

	// Minify JSON
	function minifyJSON() {
		const input = getInputValue().trim();
		
		if (!input) {
			showToast('Please enter some JSON', 'warning');
			return;
		}

		try {
			const parsed = JSON.parse(input);
			const minified = JSON.stringify(parsed);
			setOutputValue(minified);
			switchTab('output');
			showToast('JSON minified successfully!', 'success');
			updateStats();
		} catch (error) {
			showToast(`Error: ${error.message}`, 'error');
			validateJSON();
		}
	}

	// Copy to clipboard
	function copyToClipboard() {
		const output = outputEditor ? outputEditor.getValue() : 
		              (document.getElementById('output-textarea') ? 
		               document.getElementById('output-textarea').value : '');
		
		if (!output) {
			showToast('No output to copy', 'warning');
			return;
		}

		navigator.clipboard.writeText(output).then(() => {
			showToast('Copied to clipboard!', 'success');
		}).catch(() => {
			showToast('Failed to copy', 'error');
		});
	}

	// Clear editors
	function clearEditors() {
		if (confirm('Are you sure you want to clear the editor?')) {
			if (inputEditor) {
				inputEditor.setValue('');
			} else {
				const textarea = document.getElementById('input-textarea');
				if (textarea) textarea.value = '';
			}
			
			setOutputValue('');
			updateStats();
			document.getElementById('editor-status').textContent = '';
			switchTab('input');
		}
	}

	// Debounce function
	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	// Event listeners
	document.addEventListener('DOMContentLoaded', function() {
		// Wait a bit for CodeMirror to load
		setTimeout(initEditors, 100);

		// Button event listeners
		const beautifyBtn = document.getElementById('beautify-btn');
		const minifyBtn = document.getElementById('minify-btn');
		const validateBtn = document.getElementById('validate-btn');
		const copyBtn = document.getElementById('copy-btn');
		const clearBtn = document.getElementById('clear-btn');

		if (beautifyBtn) beautifyBtn.addEventListener('click', beautifyJSON);
		if (minifyBtn) minifyBtn.addEventListener('click', minifyJSON);
		if (validateBtn) validateBtn.addEventListener('click', validateJSON);
		if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
		if (clearBtn) clearBtn.addEventListener('click', clearEditors);

		// Keyboard shortcuts
		document.addEventListener('keydown', function(e) {
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
				e.preventDefault();
				beautifyJSON();
			}
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
				e.preventDefault();
				minifyJSON();
			}
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				beautifyJSON();
			}
		});

		// Update stats on load
		updateStats();
	});

	// Listen for theme changes
	const observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
				if (inputEditor) inputEditor.setOption('theme', getEditorTheme());
				if (outputEditor) outputEditor.setOption('theme', getEditorTheme());
			}
		});
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});

})();

