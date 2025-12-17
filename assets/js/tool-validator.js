/**
 * JSON Validator Tool
 * Client-side JSON validation
 */

(function() {
	'use strict';

	let inputEditor;
	let isInitialized = false;

	function initEditor() {
		if (isInitialized) return;

		const inputElement = document.getElementById('input-editor');
		if (!inputElement) return;

		if (typeof CodeMirror !== 'undefined') {
			inputEditor = CodeMirror(inputElement, {
				value: '',
				mode: 'application/json',
				theme: getEditorTheme(),
				lineNumbers: true,
				lineWrapping: true,
				autofocus: true,
				placeholder: 'Paste your JSON to validate...',
			});

			inputEditor.on('change', debounce(validateJSON, 300));
		} else {
			initTextareaEditor();
		}

		isInitialized = true;
	}

	function initTextareaEditor() {
		const inputElement = document.getElementById('input-editor');
		const textarea = document.createElement('textarea');
		textarea.id = 'input-textarea';
		textarea.className = 'json-editor-textarea';
		textarea.placeholder = 'Paste your JSON to validate...';
		textarea.spellcheck = false;
		inputElement.appendChild(textarea);

		textarea.addEventListener('input', debounce(validateJSON, 300));
	}

	function getEditorTheme() {
		const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
		              document.body.classList.contains('dark-mode');
		return isDark ? 'material-darker' : 'default';
	}

	function getInputValue() {
		if (inputEditor) {
			return inputEditor.getValue();
		}
		const textarea = document.getElementById('input-textarea');
		return textarea ? textarea.value : '';
	}

	function validateJSON() {
		const input = getInputValue().trim();
		const statusEl = document.getElementById('validation-status');
		const errorsEl = document.getElementById('validation-errors');

		if (!input) {
			if (statusEl) statusEl.innerHTML = '';
			if (errorsEl) errorsEl.innerHTML = '';
			return;
		}

		const strictMode = document.getElementById('strict-mode')?.checked || false;
		const checkDuplicates = document.getElementById('check-duplicates')?.checked || false;
		const checkTrailing = document.getElementById('check-trailing-commas')?.checked || false;

		const errors = [];

		// Check for trailing commas
		if (checkTrailing) {
			const trailingCommaRegex = /,\s*[}\]])/g;
			if (trailingCommaRegex.test(input)) {
				errors.push({
					type: 'trailing-comma',
					message: 'Trailing comma found',
					line: getLineNumber(input, trailingCommaRegex.lastIndex)
				});
			}
		}

		// Try to parse JSON
		try {
			const parsed = JSON.parse(input);

			// Check for duplicate keys
			if (checkDuplicates) {
				const duplicates = findDuplicateKeys(parsed);
				if (duplicates.length > 0) {
					errors.push({
						type: 'duplicate-keys',
						message: `Duplicate keys found: ${duplicates.join(', ')}`,
						keys: duplicates
					});
				}
			}

			// Strict mode checks
			if (strictMode) {
				if (Array.isArray(parsed) && parsed.length === 0) {
					errors.push({
						type: 'strict',
						message: 'Empty array in strict mode'
					});
				}
			}

			if (errors.length === 0) {
				showSuccess('Valid JSON!');
			} else {
				showErrors(errors, true);
			}
		} catch (error) {
			const lineMatch = error.message.match(/position (\d+)/);
			const position = lineMatch ? parseInt(lineMatch[1], 10) : 0;
			const line = getLineNumber(input, position);

			errors.push({
				type: 'syntax',
				message: error.message,
				line: line,
				position: position
			});

			showErrors(errors, false);
		}
	}

	function findDuplicateKeys(obj, path = '', duplicates = []) {
		if (typeof obj !== 'object' || obj === null) return duplicates;

		const keys = {};
		for (const key in obj) {
			if (keys[key]) {
				duplicates.push(path ? `${path}.${key}` : key);
			}
			keys[key] = true;
			findDuplicateKeys(obj[key], path ? `${path}.${key}` : key, duplicates);
		}

		return duplicates;
	}

	function getLineNumber(text, position) {
		return text.substring(0, position).split('\n').length;
	}

	function showSuccess(message) {
		const statusEl = document.getElementById('validation-status');
		const errorsEl = document.getElementById('validation-errors');

		if (statusEl) {
			statusEl.className = 'validation-status status-valid';
			statusEl.innerHTML = `<div class="status-icon">✓</div><div class="status-message">${message}</div>`;
		}

		if (errorsEl) errorsEl.innerHTML = '';
	}

	function showErrors(errors, isValid) {
		const statusEl = document.getElementById('validation-status');
		const errorsEl = document.getElementById('validation-errors');

		if (statusEl) {
			statusEl.className = 'validation-status status-invalid';
			statusEl.innerHTML = `<div class="status-icon">✗</div><div class="status-message">${isValid ? 'Valid JSON with warnings' : 'Invalid JSON'}</div>`;
		}

		if (errorsEl) {
			errorsEl.innerHTML = errors.map(error => `
				<div class="validation-error">
					<div class="error-type">${error.type}</div>
					<div class="error-message">${error.message}</div>
					${error.line ? `<div class="error-line">Line ${error.line}</div>` : ''}
				</div>
			`).join('');
		}
	}

	function clearEditor() {
		if (confirm('Are you sure you want to clear the editor?')) {
			if (inputEditor) {
				inputEditor.setValue('');
			} else {
				const textarea = document.getElementById('input-textarea');
				if (textarea) textarea.value = '';
			}

			document.getElementById('validation-status').innerHTML = '';
			document.getElementById('validation-errors').innerHTML = '';
		}
	}

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

	document.addEventListener('DOMContentLoaded', function() {
		setTimeout(initEditor, 100);

		const validateBtn = document.getElementById('validate-btn');
		const clearBtn = document.getElementById('clear-btn');

		if (validateBtn) validateBtn.addEventListener('click', validateJSON);
		if (clearBtn) clearBtn.addEventListener('click', clearEditor);

		// Auto-validate on load if there's content
		const input = getInputValue();
		if (input.trim()) {
			validateJSON();
		}
	});

})();

