<?php
/**
 * Template Name: API Dashboard Tool (PRO)
 * Template for API Dashboard - PRO feature
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'api-dashboard';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-api-dashboard">
	<div class="tool-page-header">
		<div class="container">
			<div class="tool-header-content">
				<h1 class="tool-title"><?php the_title(); ?></h1>
				<?php if ( $is_pro && ! json_studio_is_pro_user() ) : ?>
					<span class="tool-badge tool-badge-pro">PRO</span>
				<?php endif; ?>
			</div>
		</div>
	</div>

	<div class="tool-page-content">
		<div class="container">
			<?php if ( ! $has_access ) : ?>
				<?php get_template_part( 'templates/parts/pro-lock' ); ?>
			<?php else : ?>
				<div class="api-dashboard">
					<div class="api-stats">
						<div class="stat-card">
							<h3><?php esc_html_e( 'API Calls', 'json-studio' ); ?></h3>
							<div class="stat-value" id="api-calls">0</div>
						</div>
						<div class="stat-card">
							<h3><?php esc_html_e( 'API Keys', 'json-studio' ); ?></h3>
							<div class="stat-value" id="api-keys">0</div>
						</div>
						<div class="stat-card">
							<h3><?php esc_html_e( 'Usage This Month', 'json-studio' ); ?></h3>
							<div class="stat-value" id="usage-month">0</div>
						</div>
					</div>

					<div class="api-sections">
						<div class="api-section">
							<h2><?php esc_html_e( 'API Keys', 'json-studio' ); ?></h2>
							<button class="btn btn-primary" id="generate-key-btn">
								<?php esc_html_e( 'Generate New Key', 'json-studio' ); ?>
							</button>
							<div class="api-keys-list" id="api-keys-list"></div>
						</div>

						<div class="api-section">
							<h2><?php esc_html_e( 'API Documentation', 'json-studio' ); ?></h2>
							<div class="api-docs">
								<p><?php esc_html_e( 'Use our REST API to access all JSON tools programmatically.', 'json-studio' ); ?></p>
								<code>POST <?php echo esc_url( home_url( '/wp-json/json-studio/v1/beautify' ) ); ?></code>
							</div>
						</div>
					</div>
				</div>
			<?php endif; ?>
		</div>
	</div>
</main>

<?php
get_footer();

