/**
 * JSON Studio Theme - Dark Mode Toggle
 */

(function() {
	'use strict';

	const darkModeToggle = document.querySelector('.dark-mode-toggle');
	const html = document.documentElement;

	// Get saved theme preference
	function getTheme() {
		return localStorage.getItem('theme') || 'light';
	}

	// Set theme
	function setTheme(theme) {
		html.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
		
		if (theme === 'dark') {
			document.body.classList.add('dark-mode');
		} else {
			document.body.classList.remove('dark-mode');
		}
	}

	// Initialize theme
	const savedTheme = getTheme();
	setTheme(savedTheme);

	// Toggle theme
	if (darkModeToggle) {
		darkModeToggle.addEventListener('click', function() {
			const currentTheme = getTheme();
			const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
			setTheme(newTheme);
		});
	}

	// Listen for system preference changes
	if (window.matchMedia) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		// Only use system preference if no manual preference is set
		if (!localStorage.getItem('theme')) {
			mediaQuery.addEventListener('change', function(e) {
				setTheme(e.matches ? 'dark' : 'light');
			});
		}
	}

})();

