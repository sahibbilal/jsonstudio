/**
 * JSON Converter Tool (PRO)
 * Convert JSON to XML, CSV, YAML, etc.
 */

(function() {
	'use strict';

	let inputEditor, outputEditor;

	function initEditors() {
		const inputEl = document.getElementById('input-editor');
		const outputEl = document.getElementById('output-editor');

		if (typeof CodeMirror !== 'undefined') {
			inputEditor = CodeMirror(inputEl, {
				value: '',
				mode: 'application/json',
				theme: getEditorTheme(),
				lineNumbers: true,
				lineWrapping: true,
			});

			outputEditor = CodeMirror(outputEl, {
				value: '',
				readOnly: true,
				theme: getEditorTheme(),
				lineNumbers: true,
				lineWrapping: true,
			});
		}
	}

	function getEditorTheme() {
		return document.documentElement.getAttribute('data-theme') === 'dark' ? 'material-darker' : 'default';
	}

	function convert() {
		const input = inputEditor ? inputEditor.getValue() : '';
		const format = document.getElementById('output-format').value;

		try {
			const json = JSON.parse(input);
			let output = '';

			switch(format) {
				case 'xml':
					output = jsonToXML(json);
					break;
				case 'csv':
					output = jsonToCSV(json);
					break;
				case 'yaml':
					output = jsonToYAML(json);
					break;
				default:
					output = JSON.stringify(json, null, 2);
			}

			if (outputEditor) {
				outputEditor.setValue(output);
				outputEditor.setOption('mode', format === 'xml' ? 'xml' : format === 'yaml' ? 'yaml' : 'javascript');
			}
			switchTab('output');
			showToast('Converted successfully!', 'success');
		} catch (error) {
			showToast(`Error: ${error.message}`, 'error');
		}
	}

	function jsonToXML(obj, root = 'root') {
		let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n`;
		xml += objectToXML(obj, 1);
		xml += `</${root}>`;
		return xml;
	}

	function objectToXML(obj, indent) {
		let xml = '';
		const spaces = '  '.repeat(indent);
		
		for (const key in obj) {
			const value = obj[key];
			if (typeof value === 'object' && value !== null) {
				xml += `${spaces}<${key}>\n`;
				xml += objectToXML(value, indent + 1);
				xml += `${spaces}</${key}>\n`;
			} else {
				xml += `${spaces}<${key}>${escapeXML(String(value))}</${key}>\n`;
			}
		}
		return xml;
	}

	function escapeXML(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function jsonToCSV(json) {
		if (Array.isArray(json) && json.length > 0) {
			const headers = Object.keys(json[0]);
			const rows = [headers.join(',')];
			json.forEach(item => {
				rows.push(headers.map(h => `"${String(item[h] || '').replace(/"/g, '""')}"`).join(','));
			});
			return rows.join('\n');
		}
		return 'Not a valid array for CSV conversion';
	}

	function jsonToYAML(obj, indent = 0) {
		let yaml = '';
		const spaces = '  '.repeat(indent);

		if (Array.isArray(obj)) {
			obj.forEach(item => {
				if (typeof item === 'object') {
					yaml += `${spaces}- `;
					yaml += objectToYAML(item, indent + 1);
				} else {
					yaml += `${spaces}- ${item}\n`;
				}
			});
		} else if (typeof obj === 'object' && obj !== null) {
			Object.keys(obj).forEach(key => {
				const value = obj[key];
				if (typeof value === 'object' && value !== null) {
					yaml += `${spaces}${key}:\n`;
					yaml += jsonToYAML(value, indent + 1);
				} else {
					yaml += `${spaces}${key}: ${value}\n`;
				}
			});
		}

		return yaml;
	}

	function objectToYAML(obj, indent) {
		let yaml = '';
		Object.keys(obj).forEach(key => {
			const value = obj[key];
			const spaces = '  '.repeat(indent);
			if (typeof value === 'object' && value !== null) {
				yaml += `${spaces}${key}:\n`;
				yaml += jsonToYAML(value, indent + 1);
			} else {
				yaml += `${spaces}${key}: ${value}\n`;
			}
		});
		return yaml;
	}

	function switchTab(tab) {
		document.querySelectorAll('.tool-tab').forEach(t => {
			t.classList.toggle('active', t.getAttribute('data-tab') === tab);
		});
		document.getElementById('input-editor').parentElement.style.display = tab === 'input' ? 'block' : 'none';
		document.getElementById('output-editor').parentElement.style.display = tab === 'output' ? 'block' : 'none';
	}

	document.addEventListener('DOMContentLoaded', function() {
		setTimeout(initEditors, 100);
		document.getElementById('convert-btn')?.addEventListener('click', convert);
		document.querySelectorAll('.tool-tab').forEach(tab => {
			tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
		});
	});
})();

