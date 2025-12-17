/**
 * JSON Studio Theme - Editor Enhancements
 * Enhanced JSON editor functionality
 */

(function() {
	'use strict';

	const editor = document.getElementById('json-editor');
	const result = document.getElementById('json-result');

	if (!editor) return;

	// Syntax highlighting (basic)
	function highlightJSON(json) {
		if (typeof json !== 'string') {
			json = JSON.stringify(json, null, 2);
		}

		return json
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
				let cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="json-' + cls + '">' + match + '</span>';
			});
	}

	// Auto-format on paste
	editor.addEventListener('paste', function(e) {
		setTimeout(() => {
			const text = editor.value;
			try {
				const parsed = JSON.parse(text);
				editor.value = JSON.stringify(parsed, null, 2);
				showToast('JSON formatted automatically', 'success');
			} catch (err) {
				// Not valid JSON, keep as is
			}
		}, 10);
	});

	// Line numbers (optional enhancement)
	function addLineNumbers() {
		// This would require additional CSS and structure
		// Placeholder for future enhancement
	}

	// Format JSON
	function formatJSON() {
		const text = editor.value.trim();
		if (!text) return;

		try {
			const parsed = JSON.parse(text);
			editor.value = JSON.stringify(parsed, null, 2);
			showToast('JSON formatted', 'success');
		} catch (error) {
			showToast('Invalid JSON: ' + error.message, 'error');
		}
	}

	// Minify JSON
	function minifyJSON() {
		const text = editor.value.trim();
		if (!text) return;

		try {
			const parsed = JSON.parse(text);
			editor.value = JSON.stringify(parsed);
			showToast('JSON minified', 'success');
		} catch (error) {
			showToast('Invalid JSON: ' + error.message, 'error');
		}
	}

	// Validate JSON
	function validateJSON() {
		const text = editor.value.trim();
		if (!text) {
			showToast('Editor is empty', 'warning');
			return false;
		}

		try {
			JSON.parse(text);
			showToast('Valid JSON', 'success');
			return true;
		} catch (error) {
			showToast('Invalid JSON: ' + error.message, 'error');
			return false;
		}
	}

	// Export functions globally for tool integration
	window.jsonStudioEditor = {
		format: formatJSON,
		minify: minifyJSON,
		validate: validateJSON,
		highlight: highlightJSON
	};

})();

