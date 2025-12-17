<?php
/**
 * Template Name: JSON Converter Tool (PRO)
 * Template for JSON Converter - PRO feature
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-converter';
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main tool-converter">
	<div class="tool-page-header">
		<div class="container">
			<div class="tool-header-content">
				<h1 class="tool-title"><?php the_title(); ?></h1>
				<?php if ( $is_pro && ! json_studio_is_pro_user() ) : ?>
					<span class="tool-badge tool-badge-pro">PRO</span>
				<?php endif; ?>
				<?php if ( has_excerpt() ) : ?>
					<p class="tool-description"><?php echo esc_html( get_the_excerpt() ); ?></p>
				<?php endif; ?>
			</div>
		</div>
	</div>

	<div class="tool-page-content">
		<div class="container">
			<div class="tool-layout">
				<?php if ( ! $has_access ) : ?>
					<div class="tool-pro-lock-modal">
						<div class="pro-lock-content">
							<div class="pro-lock-icon">🔒</div>
							<h2><?php esc_html_e( 'PRO Feature', 'json-studio' ); ?></h2>
							<p><?php esc_html_e( 'This tool is available exclusively for PRO users. Upgrade now to unlock all premium features!', 'json-studio' ); ?></p>
							<ul class="pro-features-list">
								<li>✅ <?php esc_html_e( 'Convert JSON to XML, CSV, YAML', 'json-studio' ); ?></li>
								<li>✅ <?php esc_html_e( 'Batch conversion support', 'json-studio' ); ?></li>
								<li>✅ <?php esc_html_e( 'Advanced formatting options', 'json-studio' ); ?></li>
							</ul>
							<a href="<?php echo esc_url( home_url( '/upgrade' ) ); ?>" class="btn btn-primary btn-lg">
								<?php esc_html_e( 'Upgrade to PRO', 'json-studio' ); ?>
							</a>
						</div>
					</div>
				<?php else : ?>
					<div class="tool-editor-container">
						<div class="tool-editor-wrapper">
							<div class="tool-editor-header">
								<div class="tool-tabs">
									<button class="tool-tab active" data-tab="input"><?php esc_html_e( 'JSON Input', 'json-studio' ); ?></button>
									<button class="tool-tab" data-tab="output"><?php esc_html_e( 'Converted Output', 'json-studio' ); ?></button>
								</div>
								<div class="tool-actions">
									<button class="btn btn-sm btn-primary" id="convert-btn">
										<?php esc_html_e( 'Convert', 'json-studio' ); ?>
									</button>
									<button class="btn btn-sm" id="copy-btn">
										<?php esc_html_e( 'Copy', 'json-studio' ); ?>
									</button>
									<button class="btn btn-sm" id="clear-btn">
										<?php esc_html_e( 'Clear', 'json-studio' ); ?>
									</button>
								</div>
							</div>
							<div class="tool-editor-content">
								<div id="input-editor" class="json-editor-wrapper"></div>
								<div id="output-editor" class="json-editor-wrapper" style="display: none;"></div>
							</div>
						</div>
					</div>

					<aside class="tool-sidebar">
						<div class="tool-options">
							<h3 class="options-title"><?php esc_html_e( 'Conversion Options', 'json-studio' ); ?></h3>
							<div class="options-content">
								<div class="option-group">
									<label for="output-format"><?php esc_html_e( 'Output Format', 'json-studio' ); ?></label>
									<select id="output-format" class="option-select">
										<option value="xml">XML</option>
										<option value="csv">CSV</option>
										<option value="yaml">YAML</option>
										<option value="toml">TOML</option>
									</select>
								</div>
								<div class="option-group">
									<label>
										<input type="checkbox" id="pretty-print" />
										<?php esc_html_e( 'Pretty Print', 'json-studio' ); ?>
									</label>
								</div>
							</div>
						</div>
					</aside>
				<?php endif; ?>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();

