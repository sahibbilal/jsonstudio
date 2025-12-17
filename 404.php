<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main">
	<div class="container">
		<section class="error-404 not-found">
			<div class="error-content">
				<h1 class="error-title">404</h1>
				<h2 class="error-heading"><?php esc_html_e( 'Page Not Found', 'json-studio' ); ?></h2>
				<p class="error-description">
					<?php esc_html_e( 'Sorry, the page you are looking for could not be found.', 'json-studio' ); ?>
				</p>
				<div class="error-actions">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn btn-primary">
						<?php esc_html_e( 'Go to Homepage', 'json-studio' ); ?>
					</a>
					<a href="<?php echo esc_url( home_url( '/json-beautifier' ) ); ?>" class="btn btn-secondary">
						<?php esc_html_e( 'Try JSON Beautifier', 'json-studio' ); ?>
					</a>
				</div>
			</div>
		</section>
	</div>
</main>

<?php
get_footer();

