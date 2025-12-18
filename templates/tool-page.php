<?php
/**
 * Template Name: Tool Page
 * Template for JSON tool pages
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = json_studio_get_tool_slug();
$is_pro    = json_studio_tool_requires_pro( $tool_slug );
$has_access = json_studio_is_pro_user() || ! $is_pro;
?>

<main id="main" class="site-main tool-page-main">
	<div class="tool-page-header">
		<div class="container">
			<div class="tool-header-content">
				<h1 class="tool-title"><?php the_title(); ?></h1>
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
								<li>✅ <?php esc_html_e( 'Unlimited usage', 'json-studio' ); ?></li>
								<li>✅ <?php esc_html_e( 'Advanced features', 'json-studio' ); ?></li>
								<li>✅ <?php esc_html_e( 'API access', 'json-studio' ); ?></li>
								<li>✅ <?php esc_html_e( 'Priority support', 'json-studio' ); ?></li>
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
									<button class="tool-tab active" data-tab="editor"><?php esc_html_e( 'Editor', 'json-studio' ); ?></button>
									<button class="tool-tab" data-tab="result"><?php esc_html_e( 'Result', 'json-studio' ); ?></button>
								</div>
								<div class="tool-actions">
									<button class="btn btn-sm" id="tool-copy" aria-label="<?php esc_attr_e( 'Copy', 'json-studio' ); ?>">
										<?php esc_html_e( 'Copy', 'json-studio' ); ?>
									</button>
									<button class="btn btn-sm" id="tool-clear" aria-label="<?php esc_attr_e( 'Clear', 'json-studio' ); ?>">
										<?php esc_html_e( 'Clear', 'json-studio' ); ?>
									</button>
									<button class="btn btn-sm btn-primary" id="tool-process">
										<?php esc_html_e( 'Process', 'json-studio' ); ?>
									</button>
								</div>
							</div>
							<div class="tool-editor-content">
								<textarea 
									id="json-editor" 
									class="json-editor" 
									placeholder="<?php esc_attr_e( 'Paste your JSON here...', 'json-studio' ); ?>"
									spellcheck="false"
								></textarea>
								<div id="json-result" class="json-result" style="display: none;"></div>
							</div>
						</div>
					</div>

					<aside class="tool-sidebar">
						<div class="tool-options">
							<h3 class="options-title"><?php esc_html_e( 'Options', 'json-studio' ); ?></h3>
							<div class="options-content">
								<?php
								// Hook for tool-specific options
								do_action( 'json_studio_tool_options', $tool_slug );
								?>
							</div>
						</div>

						<?php if ( $is_pro && json_studio_is_pro_user() ) : ?>
							<div class="tool-pro-info">
								<h3><?php esc_html_e( 'PRO Features', 'json-studio' ); ?></h3>
								<p><?php esc_html_e( 'You have access to all PRO features!', 'json-studio' ); ?></p>
							</div>
						<?php endif; ?>
					</aside>
				<?php endif; ?>
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

