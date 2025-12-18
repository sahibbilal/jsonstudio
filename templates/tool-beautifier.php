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
// All tools are free
?>

<main id="main" class="site-main tool-page-main tool-beautifier">
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
				<!-- React App Container -->
				<div id="json-beautifier-root"></div>
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

