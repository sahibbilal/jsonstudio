<?php
/**
 * The template for displaying all pages
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main">
	<div class="container">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
				<?php if ( ! is_front_page() ) : ?>
					<header class="entry-header">
						<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
					</header>
				<?php endif; ?>

				<div class="entry-content">
					<?php
					the_content();
					wp_link_pages( array(
						'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'json-studio' ),
						'after'  => '</div>',
					) );
					?>
				</div>

				<?php if ( comments_open() || get_comments_number() ) : ?>
					<div class="comments-wrapper">
						<?php comments_template(); ?>
					</div>
				<?php endif; ?>
			</article>
			<?php
		endwhile;
		?>
	</div>
</main>

<?php
get_footer();

