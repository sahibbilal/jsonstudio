<?php
/**
 * The template for displaying search results
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main">
	<div class="container">
		<header class="page-header">
			<h1 class="page-title">
				<?php
				printf(
					/* translators: %s: search query. */
					esc_html__( 'Search Results for: %s', 'json-studio' ),
					'<span>' . get_search_query() . '</span>'
				);
				?>
			</h1>
		</header>

		<?php if ( have_posts() ) : ?>
			<div class="posts-grid">
				<?php
				while ( have_posts() ) :
					the_post();
					?>
					<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
						<?php if ( has_post_thumbnail() ) : ?>
							<div class="post-thumbnail">
								<a href="<?php the_permalink(); ?>">
									<?php the_post_thumbnail( 'medium' ); ?>
								</a>
							</div>
						<?php endif; ?>

						<div class="post-content">
							<header class="entry-header">
								<?php the_title( '<h2 class="entry-title"><a href="' . esc_url( get_permalink() ) . '">', '</a></h2>' ); ?>
								<div class="entry-meta">
									<span class="posted-on">
										<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
											<?php echo esc_html( get_the_date() ); ?>
										</time>
									</span>
									<?php if ( get_post_type() === 'post' && get_the_category_list() ) : ?>
										<span class="cat-links">
											<?php echo get_the_category_list( ', ' ); ?>
										</span>
									<?php endif; ?>
								</div>
							</header>

							<div class="entry-summary">
								<?php the_excerpt(); ?>
							</div>

							<a href="<?php the_permalink(); ?>" class="read-more">
								<?php esc_html_e( 'Read More', 'json-studio' ); ?>
							</a>
						</div>
					</article>
					<?php
				endwhile;
				?>
			</div>

			<?php
			the_posts_pagination( array(
				'mid_size'  => 2,
				'prev_text' => esc_html__( 'Previous', 'json-studio' ),
				'next_text' => esc_html__( 'Next', 'json-studio' ),
			) );
			?>

		<?php else : ?>
			<div class="no-results">
				<h2><?php esc_html_e( 'Nothing Found', 'json-studio' ); ?></h2>
				<p><?php esc_html_e( 'Sorry, but nothing matched your search terms. Please try again with different keywords.', 'json-studio' ); ?></p>
				<?php get_search_form(); ?>
			</div>
		<?php endif; ?>
	</div>
</main>

<?php
get_footer();

