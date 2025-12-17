<?php
/**
 * Template Name: JSON Schema Generator Tool (PRO)
 * Template for JSON Schema Generator - PRO feature
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-schema-generator';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-schema-generator">
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
									<button class="tool-tab active" data-tab="input"><?php esc_html_e( 'JSON Input', 'json-studio' ); ?></button>
									<button class="tool-tab" data-tab="schema"><?php esc_html_e( 'Generated Schema', 'json-studio' ); ?></button>
								</div>
								<div class="tool-actions">
									<button class="btn btn-sm btn-primary" id="generate-btn">
										<?php esc_html_e( 'Generate Schema', 'json-studio' ); ?>
									</button>
									<button class="btn btn-sm" id="copy-btn"><?php esc_html_e( 'Copy', 'json-studio' ); ?></button>
									<button class="btn btn-sm" id="clear-btn"><?php esc_html_e( 'Clear', 'json-studio' ); ?></button>
								</div>
							</div>
							<div class="tool-editor-content">
								<div id="input-editor" class="json-editor-wrapper"></div>
								<div id="schema-editor" class="json-editor-wrapper" style="display: none;"></div>
							</div>
						</div>
					</div>
					<aside class="tool-sidebar">
						<div class="tool-options">
							<h3 class="options-title"><?php esc_html_e( 'Schema Options', 'json-studio' ); ?></h3>
							<div class="options-content">
								<div class="option-group">
									<label>
										<input type="checkbox" id="include-descriptions" />
										<?php esc_html_e( 'Include Descriptions', 'json-studio' ); ?>
									</label>
								</div>
								<div class="option-group">
									<label>
										<input type="checkbox" id="strict-types" />
										<?php esc_html_e( 'Strict Type Checking', 'json-studio' ); ?>
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

