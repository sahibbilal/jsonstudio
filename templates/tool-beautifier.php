<?php
/**
 * Template Name: JSON Beautifier Tool
 * Template for JSON Beautifier & Minifier
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-beautifier';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-beautifier">
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
								<button class="tool-tab active" data-tab="input"><?php esc_html_e( 'Input', 'json-studio' ); ?></button>
								<button class="tool-tab" data-tab="output"><?php esc_html_e( 'Output', 'json-studio' ); ?></button>
							</div>
							<div class="tool-actions">
								<button class="btn btn-sm" id="beautify-btn">
									<?php esc_html_e( 'Beautify', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="minify-btn">
									<?php esc_html_e( 'Minify', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="validate-btn">
									<?php esc_html_e( 'Validate', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="copy-btn" aria-label="<?php esc_attr_e( 'Copy', 'json-studio' ); ?>">
									<?php esc_html_e( 'Copy', 'json-studio' ); ?>
								</button>
								<button class="btn btn-sm" id="clear-btn" aria-label="<?php esc_attr_e( 'Clear', 'json-studio' ); ?>">
									<?php esc_html_e( 'Clear', 'json-studio' ); ?>
								</button>
							</div>
						</div>
						<div class="tool-editor-content">
							<div id="input-editor" class="json-editor-wrapper"></div>
							<div id="output-editor" class="json-editor-wrapper" style="display: none;"></div>
						</div>
						<div class="tool-editor-footer">
							<div class="editor-stats">
								<span id="char-count">0 characters</span>
								<span id="line-count">0 lines</span>
								<span id="size-info">0 KB</span>
							</div>
							<div class="editor-status" id="editor-status"></div>
						</div>
					</div>
				</div>

				<aside class="tool-sidebar">
					<div class="tool-options">
						<h3 class="options-title"><?php esc_html_e( 'Formatting Options', 'json-studio' ); ?></h3>
						<div class="options-content">
							<div class="option-group">
								<label for="indent-size"><?php esc_html_e( 'Indent Size', 'json-studio' ); ?></label>
								<select id="indent-size" class="option-select">
									<option value="2">2 spaces</option>
									<option value="4" selected>4 spaces</option>
									<option value="8">8 spaces</option>
									<option value="\t">Tab</option>
								</select>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="sort-keys" />
									<?php esc_html_e( 'Sort Keys Alphabetically', 'json-studio' ); ?>
								</label>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="escape-unicode" />
									<?php esc_html_e( 'Escape Unicode Characters', 'json-studio' ); ?>
								</label>
							</div>
							<div class="option-group">
								<label>
									<input type="checkbox" id="remove-comments" />
									<?php esc_html_e( 'Remove Comments', 'json-studio' ); ?>
								</label>
							</div>
						</div>
					</div>

					<div class="tool-info">
						<h3><?php esc_html_e( 'Tips', 'json-studio' ); ?></h3>
						<ul class="tips-list">
							<li><?php esc_html_e( 'Paste or type JSON in the input editor', 'json-studio' ); ?></li>
							<li><?php esc_html_e( 'Click Beautify to format with proper indentation', 'json-studio' ); ?></li>
							<li><?php esc_html_e( 'Click Minify to compress JSON to a single line', 'json-studio' ); ?></li>
							<li><?php esc_html_e( 'Use Validate to check JSON syntax', 'json-studio' ); ?></li>
						</ul>
					</div>
				</aside>
			</div>

			<?php if ( have_posts() ) : ?>
				<?php while ( have_posts() ) : the_post(); ?>
					<div class="tool-content">
						<?php the_content(); ?>
					</div>
				<?php endwhile; ?>
			<?php endif; ?>
		</div>
	</div>
</main>

<?php
get_footer();

