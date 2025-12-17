/**
 * JSON Tree Viewer Tool
 * Interactive JSON tree visualization
 */

(function() {
	'use strict';

	let inputEditor;
	let treeData = null;

	function initEditor() {
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
				placeholder: 'Paste your JSON here...',
			});
		} else {
			initTextareaEditor();
		}
	}

	function initTextareaEditor() {
		const inputElement = document.getElementById('input-editor');
		const textarea = document.createElement('textarea');
		textarea.id = 'input-textarea';
		textarea.className = 'json-editor-textarea';
		textarea.placeholder = 'Paste your JSON here...';
		textarea.spellcheck = false;
		inputElement.appendChild(textarea);
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

	function loadTree() {
		const input = getInputValue().trim();
		
		if (!input) {
			showToast('Please enter some JSON', 'warning');
			return;
		}

		try {
			treeData = JSON.parse(input);
			renderTree(treeData);
			switchTab('tree');
			showToast('Tree loaded successfully!', 'success');
		} catch (error) {
			showToast(`Error: ${error.message}`, 'error');
		}
	}

	function renderTree(data) {
		const container = document.getElementById('tree-viewer');
		if (!container) return;

		container.innerHTML = '';
		const tree = buildTreeElement(data, 'root');
		container.appendChild(tree);
	}

	function buildTreeElement(data, key, path = '') {
		const item = document.createElement('div');
		item.className = 'tree-item';
		
		const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);
		const isArray = Array.isArray(data);
		const isExpandable = isObject || isArray;

		const header = document.createElement('div');
		header.className = 'tree-item-header';
		if (isExpandable) {
			header.classList.add('expandable');
		}

		const toggle = document.createElement('span');
		toggle.className = 'tree-toggle';
		if (isExpandable) {
			toggle.textContent = '▶';
			toggle.addEventListener('click', function(e) {
				e.stopPropagation();
				toggleItem(item);
			});
		}

		const keySpan = document.createElement('span');
		keySpan.className = 'tree-key';
		keySpan.textContent = key === 'root' ? 'root' : `"${key}":`;

		const typeSpan = document.createElement('span');
		typeSpan.className = 'tree-type';
		typeSpan.textContent = getTypeLabel(data);

		const valueSpan = document.createElement('span');
		valueSpan.className = 'tree-value';
		
		if (!isExpandable) {
			valueSpan.textContent = formatValue(data);
			valueSpan.className += ` tree-value-${getValueType(data)}`;
		} else {
			const count = isArray ? data.length : Object.keys(data).length;
			valueSpan.textContent = isArray ? `[${count} items]` : `{${count} properties}`;
		}

		header.appendChild(toggle);
		header.appendChild(keySpan);
		if (document.getElementById('show-types')?.checked) {
			header.appendChild(typeSpan);
		}
		header.appendChild(valueSpan);

		item.appendChild(header);

		if (isExpandable) {
			const children = document.createElement('div');
			children.className = 'tree-children';
			children.style.display = 'none';

			if (isArray) {
				data.forEach((value, index) => {
					const child = buildTreeElement(value, index, `${path}[${index}]`);
					children.appendChild(child);
				});
			} else {
				Object.keys(data).forEach(childKey => {
					const child = buildTreeElement(data[childKey], childKey, path ? `${path}.${childKey}` : childKey);
					children.appendChild(child);
				});
			}

			item.appendChild(children);
		}

		return item;
	}

	function toggleItem(item) {
		const children = item.querySelector('.tree-children');
		const toggle = item.querySelector('.tree-toggle');
		
		if (!children || !toggle) return;

		const isExpanded = children.style.display !== 'none';
		children.style.display = isExpanded ? 'none' : 'block';
		toggle.textContent = isExpanded ? '▶' : '▼';
		item.classList.toggle('expanded', !isExpanded);
	}

	function formatValue(value) {
		if (value === null) return 'null';
		if (typeof value === 'string') return `"${value}"`;
		return String(value);
	}

	function getValueType(value) {
		if (value === null) return 'null';
		if (typeof value === 'string') return 'string';
		if (typeof value === 'number') return 'number';
		if (typeof value === 'boolean') return 'boolean';
		return 'other';
	}

	function getTypeLabel(value) {
		if (value === null) return 'null';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'object') return 'object';
		return typeof value;
	}

	function expandAll() {
		document.querySelectorAll('.tree-item.expandable').forEach(item => {
			const children = item.querySelector('.tree-children');
			const toggle = item.querySelector('.tree-toggle');
			if (children && toggle) {
				children.style.display = 'block';
				toggle.textContent = '▼';
				item.classList.add('expanded');
			}
		});
	}

	function collapseAll() {
		document.querySelectorAll('.tree-item.expandable').forEach(item => {
			const children = item.querySelector('.tree-children');
			const toggle = item.querySelector('.tree-toggle');
			if (children && toggle) {
				children.style.display = 'none';
				toggle.textContent = '▶';
				item.classList.remove('expanded');
			}
		});
	}

	function switchTab(tabName) {
		const tabs = document.querySelectorAll('.tool-tab');
		const inputWrapper = document.getElementById('input-editor').parentElement;
		const treeWrapper = document.getElementById('tree-viewer').parentElement;

		tabs.forEach(tab => {
			if (tab.getAttribute('data-tab') === tabName) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		});

		if (tabName === 'input') {
			inputWrapper.style.display = 'block';
			treeWrapper.style.display = 'none';
			if (inputEditor) inputEditor.refresh();
		} else {
			inputWrapper.style.display = 'none';
			treeWrapper.style.display = 'block';
		}
	}

	function clearEditor() {
		if (confirm('Are you sure you want to clear?')) {
			if (inputEditor) {
				inputEditor.setValue('');
			} else {
				const textarea = document.getElementById('input-textarea');
				if (textarea) textarea.value = '';
			}
			document.getElementById('tree-viewer').innerHTML = '';
			switchTab('input');
		}
	}

	document.addEventListener('DOMContentLoaded', function() {
		setTimeout(initEditor, 100);

		document.querySelectorAll('.tool-tab').forEach(tab => {
			tab.addEventListener('click', function() {
				switchTab(this.getAttribute('data-tab'));
			});
		});

		const loadBtn = document.getElementById('load-btn');
		const expandBtn = document.getElementById('expand-all-btn');
		const collapseBtn = document.getElementById('collapse-all-btn');
		const clearBtn = document.getElementById('clear-btn');

		if (loadBtn) loadBtn.addEventListener('click', loadTree);
		if (expandBtn) expandBtn.addEventListener('click', expandAll);
		if (collapseBtn) collapseBtn.addEventListener('click', collapseAll);
		if (clearBtn) clearBtn.addEventListener('click', clearEditor);
	});

})();

