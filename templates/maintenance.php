<?php
/**
 * Template Name: Maintenance Mode
 * Maintenance page template
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main maintenance-page">
	<div class="maintenance-container">
		<div class="maintenance-content">
			<div class="maintenance-icon">🔧</div>
			<h1 class="maintenance-title"><?php esc_html_e( 'We\'ll be back soon!', 'json-studio' ); ?></h1>
			<p class="maintenance-description">
				<?php esc_html_e( 'We\'re currently performing some maintenance. We\'ll be back online shortly.', 'json-studio' ); ?>
			</p>
			<p class="maintenance-time">
				<?php esc_html_e( 'Estimated time: 30 minutes', 'json-studio' ); ?>
			</p>
		</div>
	</div>
</main>

<?php
get_footer();

