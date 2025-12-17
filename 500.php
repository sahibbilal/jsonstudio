<?php
/**
 * The template for displaying 500 error pages
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main">
	<div class="container">
		<section class="error-500 server-error">
			<div class="error-content">
				<h1 class="error-title">500</h1>
				<h2 class="error-heading"><?php esc_html_e( 'Internal Server Error', 'json-studio' ); ?></h2>
				<p class="error-description">
					<?php esc_html_e( 'Something went wrong on our end. We\'re working to fix the issue. Please try again later.', 'json-studio' ); ?>
				</p>
				<div class="error-actions">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn btn-primary">
						<?php esc_html_e( 'Go to Homepage', 'json-studio' ); ?>
					</a>
					<button onclick="window.location.reload()" class="btn btn-secondary">
						<?php esc_html_e( 'Reload Page', 'json-studio' ); ?>
					</button>
				</div>
			</div>
		</section>
	</div>
</main>

<?php
get_footer();

