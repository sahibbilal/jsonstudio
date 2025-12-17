<?php
/**
 * Template Name: JSON Converter Tool
 * Template for JSON Converter
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
				<!-- React App Container -->
				<div id="json-converter-root"></div>
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

