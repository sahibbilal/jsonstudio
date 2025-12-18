<?php
/**
 * Template Name: Privacy Policy
 * Template for Privacy Policy page
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main privacy-policy-page">
	<div class="container" style="max-width: 800px; margin: 0 auto; padding: var(--spacing-xl) var(--spacing-md);">
		<header class="page-header" style="margin-bottom: var(--spacing-xl); text-align: center;">
			<h1 class="page-title" style="font-size: 2.5rem; margin-bottom: var(--spacing-md);">
				<?php esc_html_e( 'Privacy Policy', 'json-studio' ); ?>
			</h1>
			<p class="page-subtitle" style="font-size: 1.125rem; color: var(--color-text-secondary);">
				<?php esc_html_e( 'Your privacy is important to us', 'json-studio' ); ?>
			</p>
		</header>

		<div class="privacy-content" style="line-height: 1.8; color: var(--color-text);">
			
			<!-- Privacy First Notice -->
			<div class="privacy-notice-box" style="
				background: var(--color-bg-secondary);
				border: 2px solid var(--color-success);
				border-radius: var(--radius-lg);
				padding: var(--spacing-lg);
				margin-bottom: var(--spacing-xl);
			">
				<h2 style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-success); font-size: 1.25rem;">
					🔒 <?php esc_html_e( 'Privacy First', 'json-studio' ); ?>
				</h2>
				<p style="margin: 0; font-size: 1rem;">
					<?php esc_html_e( 'All JSON processing happens entirely in your browser. Your data never leaves your device. We don\'t track, store, or analyze your content.', 'json-studio' ); ?>
				</p>
			</div>

			<!-- Last Updated -->
			<p style="font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: var(--spacing-xl);">
				<strong><?php esc_html_e( 'Last Updated:', 'json-studio' ); ?></strong> 
				<?php echo esc_html( date_i18n( get_option( 'date_format' ) ) ); ?>
			</p>

			<!-- Data Collection -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '1. Data Collection', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'JSON Studio is designed with privacy in mind. We collect minimal data and only what is necessary for the application to function.', 'json-studio' ); ?>
				</p>
				
				<h3 style="font-size: 1.25rem; margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm);">
					<?php esc_html_e( 'What We Store Locally', 'json-studio' ); ?>
				</h3>
				<p style="margin-bottom: var(--spacing-sm);">
					<?php esc_html_e( 'The following data is stored locally in your browser using localStorage:', 'json-studio' ); ?>
				</p>
				<ul style="margin-left: var(--spacing-lg); margin-bottom: var(--spacing-md);">
					<li style="margin-bottom: var(--spacing-xs);">
						<strong><?php esc_html_e( 'Theme Preference:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'Your dark/light mode preference (light or dark)', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<strong><?php esc_html_e( 'Font Size Preference:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'Your accessibility font size setting (small, medium, large, xlarge)', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<strong><?php esc_html_e( 'High Contrast Mode:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'Your accessibility high contrast mode preference (true or false)', 'json-studio' ); ?>
					</li>
				</ul>

				<h3 style="font-size: 1.25rem; margin-top: var(--spacing-lg); margin-bottom: var(--spacing-sm);">
					<?php esc_html_e( 'What We Do NOT Store', 'json-studio' ); ?>
				</h3>
				<ul style="margin-left: var(--spacing-lg); margin-bottom: var(--spacing-md);">
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Your JSON content or data', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Any user input or file contents', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Personal information or identification data', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Analytics or tracking data', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'IP addresses or location data', 'json-studio' ); ?>
					</li>
				</ul>
			</section>

			<!-- Data Processing -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '2. Data Processing', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'All JSON processing happens entirely in your browser using JavaScript. No data is sent to our servers or any third-party services.', 'json-studio' ); ?>
				</p>
				<div style="background: var(--color-bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md);">
					<p style="margin: 0; font-weight: 600;">
						<?php esc_html_e( 'Key Points:', 'json-studio' ); ?>
					</p>
					<ul style="margin: var(--spacing-sm) 0 0 var(--spacing-lg);">
						<li style="margin-bottom: var(--spacing-xs);">
							<?php esc_html_e( 'All operations (beautify, validate, convert, etc.) run locally in your browser', 'json-studio' ); ?>
						</li>
						<li style="margin-bottom: var(--spacing-xs);">
							<?php esc_html_e( 'No network requests are made for JSON processing', 'json-studio' ); ?>
						</li>
						<li style="margin-bottom: var(--spacing-xs);">
							<?php esc_html_e( 'No API calls or server-side processing', 'json-studio' ); ?>
						</li>
						<li style="margin-bottom: var(--spacing-xs);">
							<?php esc_html_e( 'Your JSON data never leaves your device', 'json-studio' ); ?>
						</li>
					</ul>
				</div>
			</section>

			<!-- Data Retention -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '3. Data Retention', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'We do not retain any of your JSON data. Since all processing happens in your browser, there is no server-side storage of your content.', 'json-studio' ); ?>
				</p>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'The only data stored (preferences) remains in your browser\'s localStorage until you delete it. You have full control over this data.', 'json-studio' ); ?>
				</p>
			</section>

			<!-- User Rights -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '4. Your Rights and Control', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'You have complete control over your data:', 'json-studio' ); ?>
				</p>
				<ul style="margin-left: var(--spacing-lg); margin-bottom: var(--spacing-md);">
					<li style="margin-bottom: var(--spacing-sm);">
						<strong><?php esc_html_e( 'View Your Data:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'Click the privacy button (🔒) in any tool to see exactly what data is stored', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-sm);">
						<strong><?php esc_html_e( 'Delete Individual Items:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'Delete specific preferences using the delete button next to each item', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-sm);">
						<strong><?php esc_html_e( 'Delete All Data:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'Use the "Delete All Local Data" button to remove all stored preferences at once', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-sm);">
						<strong><?php esc_html_e( 'Browser Settings:', 'json-studio' ); ?></strong> 
						<?php esc_html_e( 'You can also clear all data through your browser\'s settings (clear site data/localStorage)', 'json-studio' ); ?>
					</li>
				</ul>
			</section>

			<!-- Third-Party Services -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '5. Third-Party Services', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'JSON Studio does not use third-party analytics, tracking, or data processing services for JSON content. All processing is done locally in your browser.', 'json-studio' ); ?>
				</p>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'If this website uses WordPress (which may include standard WordPress features), please refer to WordPress\'s privacy policy for information about WordPress core functionality.', 'json-studio' ); ?>
				</p>
			</section>

			<!-- Cookies -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '6. Cookies and Local Storage', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'JSON Studio uses browser localStorage (not cookies) to store your preferences. This data:', 'json-studio' ); ?>
				</p>
				<ul style="margin-left: var(--spacing-lg); margin-bottom: var(--spacing-md);">
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Is stored only on your device', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Is not sent to any server', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Can be deleted at any time through the privacy settings', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Is only used to remember your preferences for a better user experience', 'json-studio' ); ?>
					</li>
				</ul>
			</section>

			<!-- Security -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '7. Security', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'Since all processing happens in your browser, your JSON data never leaves your device. This means:', 'json-studio' ); ?>
				</p>
				<ul style="margin-left: var(--spacing-lg); margin-bottom: var(--spacing-md);">
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'No risk of data breaches on our servers (we don\'t store your data)', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'No risk of unauthorized access to your JSON content', 'json-studio' ); ?>
					</li>
					<li style="margin-bottom: var(--spacing-xs);">
						<?php esc_html_e( 'Your data is as secure as your device', 'json-studio' ); ?>
					</li>
				</ul>
			</section>

			<!-- Changes to Policy -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '8. Changes to This Privacy Policy', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.', 'json-studio' ); ?>
				</p>
			</section>

			<!-- Contact -->
			<section style="margin-bottom: var(--spacing-xl);">
				<h2 style="font-size: 1.75rem; margin-bottom: var(--spacing-md); color: var(--color-text);">
					<?php esc_html_e( '9. Contact Us', 'json-studio' ); ?>
				</h2>
				<p style="margin-bottom: var(--spacing-md);">
					<?php esc_html_e( 'If you have any questions about this privacy policy or our data practices, please contact us through the contact page.', 'json-studio' ); ?>
				</p>
			</section>

			<!-- Summary Box -->
			<div class="privacy-summary-box" style="
				background: var(--color-info-bg, rgba(59, 130, 246, 0.1));
				border-left: 4px solid var(--color-info);
				border-radius: var(--radius-md);
				padding: var(--spacing-lg);
				margin-top: var(--spacing-xl);
			">
				<h3 style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-info); font-size: 1.125rem;">
					<?php esc_html_e( 'Summary', 'json-studio' ); ?>
				</h3>
				<p style="margin: 0; font-size: 0.9375rem;">
					<?php esc_html_e( 'JSON Studio is privacy-first. We don\'t collect, store, or process your JSON data on any server. All processing happens in your browser. The only data we store locally are your preferences (theme, font size, etc.), which you can view and delete at any time through the privacy settings.', 'json-studio' ); ?>
				</p>
			</div>

		</div>
	</div>
</main>

<?php
get_footer();

