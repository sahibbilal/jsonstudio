<?php
/**
 * Template Name: JSON Validator Tool
 * Template for JSON Validator
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-validator';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-validator">
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
							<div class="tool-actions">
								<button class="btn btn-sm btn-primary" id="validate-btn">
									<?php esc_html_e( 'Validate JSON', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="clear-btn" aria-label="<?php esc_attr_e( 'Clear', 'json-studio' ); ?>">
									<?php esc_html_e( 'Clear', 'json-studio' ); ?>
								</button>
							</div>
						</div>
						<div class="tool-editor-content">
							<div id="input-editor" class="json-editor-wrapper"></div>
						</div>
						<div class="validation-results" id="validation-results">
							<div class="validation-status" id="validation-status"></div>
							<div class="validation-errors" id="validation-errors"></div>
						</div>
					</div>
				</div>

				<aside class="tool-sidebar">
					<div class="tool-options">
						<h3 class="options-title"><?php esc_html_e( 'Validation Options', 'json-studio' ); ?></h3>
						<div class="options-content">
							<div class="option-group">
								<label>
									<input type="checkbox" id="strict-mode" />
									<?php esc_html_e( 'Strict Mode', 'json-studio' ); ?>
								</label>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="check-duplicates" />
									<?php esc_html_e( 'Check for Duplicate Keys', 'json-studio' ); ?>
								</label>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="check-trailing-commas" />
									<?php esc_html_e( 'Check for Trailing Commas', 'json-studio' ); ?>
								</label>
							</div>
						</div>
					</div>

					<div class="tool-info">
						<h3><?php esc_html_e( 'Validation Info', 'json-studio' ); ?></h3>
						<p><?php esc_html_e( 'This tool validates JSON syntax and structure. It checks for:', 'json-studio' ); ?></p>
						<ul class="tips-list">
							<li><?php esc_html_e( 'Valid JSON syntax', 'json-studio' ); ?></li>
							<li><?php esc_html_e( 'Proper brackets and braces', 'json-studio' ); ?></li>
							<li><?php esc_html_e( 'Correct string escaping', 'json-studio' ); ?></li>
							<li><?php esc_html_e( 'Valid number formats', 'json-studio' ); ?></li>
						</ul>
					</div>
				</aside>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();

