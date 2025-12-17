<?php
/**
 * Template Name: JSON Tree Viewer Tool
 * Template for JSON Tree Viewer
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-viewer';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-viewer">
	<div class="tool-page-header">
		<div class="container">
			<div class="tool-header-content">
				<h1 class="tool-title"><?php the_title(); ?></h1>
				<span class="tool-badge tool-badge-free">FREE</span>
				<?php if ( has_excerpt() ) : ?>
					<p class="tool-description"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>
			</div>
		</div>
	</div>

	<div class="tool-page-content">
		<div class="container">
			<div class="tool-layout">
				<div class="tool-editor-container">
					<div class="tool-editor-wrapper">
						<div class="tool-editor-header">
							<div class="tool-tabs">
								<button class="tool-tab active" data-tab="input"><?php esc_html_e( 'JSON Input', 'json-studio' ); ?></button>
								<button class="tool-tab" data-tab="tree"><?php esc_html_e( 'Tree View', 'json-studio' ); ?></button>
							</div>
							<div class="tool-actions">
								<button class="btn btn-sm btn-primary" id="load-btn">
									<?php esc_html_e( 'Load Tree', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="expand-all-btn">
									<?php esc_html_e( 'Expand All', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="collapse-all-btn">
									<?php esc_html_e( 'Collapse All', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="clear-btn">
									<?php esc_html_e( 'Clear', 'json-studio' ); ?>
								</button>
							</div>
						</div>
						<div class="tool-editor-content">
							<div id="input-editor" class="json-editor-wrapper"></div>
							<div id="tree-viewer" class="json-tree-viewer" style="display: none;"></div>
						</div>
					</div>
				</div>

				<aside class="tool-sidebar">
					<div class="tool-options">
						<h3 class="options-title"><?php esc_html_e( 'View Options', 'json-studio' ); ?></h3>
						<div class="options-content">
							<div class="option-group">
								<label>
									<input type="checkbox" id="show-line-numbers" checked />
									<?php esc_html_e( 'Show Line Numbers', 'json-studio' ); ?>
								</label>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="highlight-values" checked />
									<?php esc_html_e( 'Highlight Values', 'json-studio' ); ?>
								</label>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="show-types" />
									<?php esc_html_e( 'Show Data Types', 'json-studio' ); ?>
								</label>
							</div>
						</div>
					</div>

					<div class="tool-info">
						<h3><?php esc_html_e( 'Tree Viewer', 'json-studio' ); ?></h3>
						<p><?php esc_html_e( 'Visualize your JSON data in an interactive tree structure. Click on nodes to expand or collapse them.', 'json-studio' ); ?></p>
					</div>
				</aside>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();

