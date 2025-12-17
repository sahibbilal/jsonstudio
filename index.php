<?php
/**
 * The main template file
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main">
	<div class="container">
		<?php
		if ( have_posts() ) :
			while ( have_posts() ) :
				the_post();
				?>
				<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
					<header class="entry-header">
						<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
					</header>

					<div class="entry-content">
						<?php
						the_content();
						wp_link_pages( array(
							'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'json-studio' ),
							'after'  => '</div>',
						) );
						?>
					</div>
				</article>
				<?php
			endwhile;
		else :
			?>
			<div class="no-results">
				<h1><?php esc_html_e( 'Nothing Found', 'json-studio' ); ?></h1>
				<p><?php esc_html_e( 'It seems we can\'t find what you\'re looking for.', 'json-studio' ); ?></p>
			</div>
			<?php
		endif;
		?>
	</div>
</main>

<?php
get_footer();

