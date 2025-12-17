<?php
/**
 * The template for displaying all single posts
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
				<header class="entry-header">
					<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
					<div class="entry-meta">
						<span class="posted-on">
							<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
								<?php echo esc_html( get_the_date() ); ?>
							</time>
						</span>
						<?php if ( get_the_category_list() ) : ?>
							<span class="cat-links">
								<?php echo get_the_category_list( ', ' ); ?>
							</span>
						<?php endif; ?>
					</div>
				</header>

				<?php if ( has_post_thumbnail() ) : ?>
					<div class="post-thumbnail">
						<?php the_post_thumbnail( 'large' ); ?>
					</div>
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

				<footer class="entry-footer">
					<?php
					$tags_list = get_the_tag_list( '', ', ' );
					if ( $tags_list ) {
						printf( '<span class="tags-links">%s</span>', $tags_list );
					}
					?>
				</footer>

				<?php
				the_post_navigation( array(
					'prev_text' => '<span class="nav-subtitle">' . esc_html__( 'Previous:', 'json-studio' ) . '</span> <span class="nav-title">%title</span>',
					'next_text' => '<span class="nav-subtitle">' . esc_html__( 'Next:', 'json-studio' ) . '</span> <span class="nav-title">%title</span>',
				) );
				?>

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

