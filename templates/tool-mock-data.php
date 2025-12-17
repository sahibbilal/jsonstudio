<?php
/**
 * Template Name: Mock Data Generator Tool (PRO)
 * Template for Mock Data Generator - PRO feature
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-mock-data';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-mock-data">
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
				<div class="tool-layout">
					<div class="tool-editor-container">
						<div class="tool-editor-wrapper">
							<div class="tool-editor-header">
								<div class="tool-tabs">
									<button class="tool-tab active" data-tab="schema"><?php esc_html_e( 'Schema Template', 'json-studio' ); ?></button>
									<button class="tool-tab" data-tab="output"><?php esc_html_e( 'Generated Data', 'json-studio' ); ?></button>
								</div>
								<div class="tool-actions">
									<button class="btn btn-sm btn-primary" id="generate-btn">
										<?php esc_html_e( 'Generate', 'json-studio' ); ?>
									</button>
									<button class="btn btn-sm" id="copy-btn"><?php esc_html_e( 'Copy', 'json-studio' ); ?></button>
									<button class="btn btn-sm" id="clear-btn"><?php esc_html_e( 'Clear', 'json-studio' ); ?></button>
								</div>
							</div>
							<div class="tool-editor-content">
								<div id="schema-editor" class="json-editor-wrapper"></div>
								<div id="output-editor" class="json-editor-wrapper" style="display: none;"></div>
							</div>
						</div>
					</div>
					<aside class="tool-sidebar">
						<div class="tool-options">
							<h3 class="options-title"><?php esc_html_e( 'Generation Options', 'json-studio' ); ?></h3>
							<div class="options-content">
								<div class="option-group">
									<label for="data-count"><?php esc_html_e( 'Number of Items', 'json-studio' ); ?></label>
									<input type="number" id="data-count" class="option-input" value="10" min="1" max="1000" />
								</div>
								<div class="option-group">
									<label>
										<input type="checkbox" id="realistic-data" />
										<?php esc_html_e( 'Realistic Data', 'json-studio' ); ?>
									</label>
								</div>
							</div>
						</div>
					</aside>
				</div>
			<?php endif; ?>
		</div>
	</div>
</main>

<?php
get_footer();

