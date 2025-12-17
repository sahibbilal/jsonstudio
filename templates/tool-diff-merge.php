<?php
/**
 * Template Name: JSON Diff & Merge Tool
 * Template for JSON Diff & Merge
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-diff-merge';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-diff-merge">
	<div class="tool-page-header">
		<div class="container">
			<div class="tool-header-content">
				<h1 class="tool-title"><?php the_title(); ?></h1>
				<span class="tool-badge tool-badge-free">FREE</span>
			</div>
		</div>
	</div>

	<div class="tool-page-content">
		<div class="container">
			<div class="diff-merge-container">
					<div class="diff-editors">
						<div class="diff-editor-left">
							<h3><?php esc_html_e( 'JSON 1', 'json-studio' ); ?></h3>
							<div id="diff-editor-1" class="json-editor-wrapper"></div>
						</div>
						<div class="diff-editor-right">
							<h3><?php esc_html_e( 'JSON 2', 'json-studio' ); ?></h3>
							<div id="diff-editor-2" class="json-editor-wrapper"></div>
						</div>
					</div>
					<div class="diff-actions">
						<button class="btn btn-primary" id="diff-btn"><?php esc_html_e( 'Compare', 'json-studio' ); ?></button>
						<button class="btn" id="merge-btn"><?php esc_html_e( 'Merge', 'json-studio' ); ?></button>
						<button class="btn" id="clear-diff-btn"><?php esc_html_e( 'Clear', 'json-studio' ); ?></button>
					</div>
					<div class="diff-results" id="diff-results"></div>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();

