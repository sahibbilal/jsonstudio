/**
 * JSON Studio Theme - Main JavaScript
 */

(function() {
	'use strict';

	// Mobile Menu Toggle
	const menuToggle = document.querySelector('.menu-toggle');
	const navMenu = document.querySelector('.nav-menu');

	if (menuToggle && navMenu) {
		menuToggle.addEventListener('click', function() {
			const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
			menuToggle.setAttribute('aria-expanded', !isExpanded);
			navMenu.classList.toggle('active');
		});

		// Close menu when clicking outside
		document.addEventListener('click', function(event) {
			if (!menuToggle.contains(event.target) && !navMenu.contains(event.target)) {
				menuToggle.setAttribute('aria-expanded', 'false');
				navMenu.classList.remove('active');
			}
		});
	}

	// User Menu Toggle
	const userMenuToggle = document.querySelector('.user-menu-toggle');
	const userMenuDropdown = document.querySelector('.user-menu-dropdown');

	if (userMenuToggle && userMenuDropdown) {
		userMenuToggle.addEventListener('click', function(e) {
			e.stopPropagation();
			const isExpanded = userMenuToggle.getAttribute('aria-expanded') === 'true';
			userMenuToggle.setAttribute('aria-expanded', !isExpanded);
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', function() {
			userMenuToggle.setAttribute('aria-expanded', 'false');
		});
	}

	// Sticky Upgrade Bar
	const stickyUpgradeBar = document.getElementById('sticky-upgrade-bar');
	const upgradeBarClose = document.querySelector('.upgrade-bar-close');

	if (stickyUpgradeBar && upgradeBarClose) {
		// Show bar if not dismissed
		if (!localStorage.getItem('upgradeBarDismissed')) {
			stickyUpgradeBar.classList.add('show');
		}

		upgradeBarClose.addEventListener('click', function() {
			stickyUpgradeBar.classList.remove('show');
			localStorage.setItem('upgradeBarDismissed', 'true');
		});
	}

	// Tool Tabs
	const toolTabs = document.querySelectorAll('.tool-tab');
	const toolEditor = document.getElementById('json-editor');
	const toolResult = document.getElementById('json-result');

	if (toolTabs.length > 0) {
		toolTabs.forEach(tab => {
			tab.addEventListener('click', function() {
				const tabName = this.getAttribute('data-tab');
				
				// Update active state
				toolTabs.forEach(t => t.classList.remove('active'));
				this.classList.add('active');

				// Show/hide content
				if (tabName === 'editor') {
					if (toolEditor) toolEditor.style.display = 'block';
					if (toolResult) toolResult.style.display = 'none';
				} else if (tabName === 'result') {
					if (toolEditor) toolEditor.style.display = 'none';
					if (toolResult) toolResult.style.display = 'block';
				}
			});
		});
	}

	// Tool Actions
	const toolCopy = document.getElementById('tool-copy');
	const toolClear = document.getElementById('tool-clear');
	const toolProcess = document.getElementById('tool-process');

	if (toolCopy && toolEditor) {
		toolCopy.addEventListener('click', function() {
			const text = toolResult ? toolResult.textContent : toolEditor.value;
			if (text) {
				navigator.clipboard.writeText(text).then(() => {
					showToast('Copied to clipboard!', 'success');
				}).catch(() => {
					showToast('Failed to copy', 'error');
				});
			}
		});
	}

	if (toolClear && toolEditor) {
		toolClear.addEventListener('click', function() {
			if (confirm('Are you sure you want to clear the editor?')) {
				toolEditor.value = '';
				if (toolResult) toolResult.textContent = '';
				showToast('Editor cleared', 'info');
			}
		});
	}

	if (toolProcess) {
		toolProcess.addEventListener('click', function() {
			const toolSlug = document.querySelector('.json-studio-tool')?.getAttribute('data-tool');
			if (toolSlug) {
				processTool(toolSlug);
			}
		});
	}

	// Toast Notification System
	window.showToast = function(message, type = 'info') {
		const container = document.getElementById('toast-container');
		if (!container) return;

		const toast = document.createElement('div');
		toast.className = `toast toast-${type}`;
		toast.textContent = message;
		toast.setAttribute('role', 'alert');

		container.appendChild(toast);

		// Auto remove after 5 seconds
		setTimeout(() => {
			toast.style.animation = 'slideOut 0.3s ease';
			setTimeout(() => {
				if (toast.parentNode) {
					toast.parentNode.removeChild(toast);
				}
			}, 300);
		}, 5000);
	};

	// Process Tool (placeholder for tool-specific logic)
	function processTool(toolSlug) {
		if (!toolEditor) return;

		const input = toolEditor.value.trim();
		if (!input) {
			showToast('Please enter some JSON data', 'warning');
			return;
		}

		// Switch to result tab
		const resultTab = document.querySelector('.tool-tab[data-tab="result"]');
		if (resultTab) {
			resultTab.click();
		}

		// Basic JSON validation
		try {
			const parsed = JSON.parse(input);
			const formatted = JSON.stringify(parsed, null, 2);
			
			if (toolResult) {
				toolResult.textContent = formatted;
			}

			// Hook for tool-specific processing
			if (window.jsonStudio && window.jsonStudio.processTool) {
				window.jsonStudio.processTool(toolSlug, input, formatted);
			}

			showToast('JSON processed successfully!', 'success');
		} catch (error) {
			if (toolResult) {
				toolResult.textContent = `Error: ${error.message}`;
			}
			showToast('Invalid JSON: ' + error.message, 'error');
		}
	}

	// Keyboard shortcuts
	document.addEventListener('keydown', function(e) {
		// Ctrl/Cmd + Enter to process
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			if (toolProcess) {
				toolProcess.click();
			}
		}

		// Ctrl/Cmd + K to clear
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			if (toolClear && document.activeElement === toolEditor) {
				e.preventDefault();
				toolClear.click();
			}
		}
	});

	// Initialize tool if on tool page
	if (document.body.classList.contains('tool-page')) {
		// Load tool-specific scripts if needed
		const toolSlug = document.querySelector('.json-studio-tool')?.getAttribute('data-tool');
		if (toolSlug && window.jsonStudio && window.jsonStudio.initTool) {
			window.jsonStudio.initTool(toolSlug);
		}
	}

})();

