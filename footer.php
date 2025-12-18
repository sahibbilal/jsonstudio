<?php
/**
 * The footer template
 *
 * @package JSONStudio
 * @since 1.0.0
 */
?>

	<footer id="colophon" class="site-footer">
		<div class="footer-container">
			<div class="footer-widgets">
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
						<?php dynamic_sidebar( 'footer-1' ); ?>
					<?php else : ?>
						<h3 class="widget-title"><?php esc_html_e( 'About', 'json-studio' ); ?></h3>
						<p><?php esc_html_e( 'JSON Studio provides powerful tools for working with JSON data. Beautify, validate, convert, and more.', 'json-studio' ); ?></p>
					<?php endif; ?>
				</div>

				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
						<?php dynamic_sidebar( 'footer-2' ); ?>
					<?php else : ?>
						<h3 class="widget-title"><?php esc_html_e( 'Tools', 'json-studio' ); ?></h3>
						<ul class="footer-menu">
							<li><a href="<?php echo esc_url( home_url( '/json-beautifier' ) ); ?>"><?php esc_html_e( 'JSON Beautifier', 'json-studio' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/json-validator' ) ); ?>"><?php esc_html_e( 'JSON Validator', 'json-studio' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/json-viewer' ) ); ?>"><?php esc_html_e( 'JSON Viewer', 'json-studio' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/json-converter' ) ); ?>"><?php esc_html_e( 'JSON Converter', 'json-studio' ); ?></a></li>
						</ul>
					<?php endif; ?>
				</div>

				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-3' ) ) : ?>
						<?php dynamic_sidebar( 'footer-3' ); ?>
					<?php else : ?>
						<h3 class="widget-title"><?php esc_html_e( 'Resources', 'json-studio' ); ?></h3>
						<ul class="footer-menu">
							<li><a href="<?php echo esc_url( home_url( '/docs' ) ); ?>"><?php esc_html_e( 'Documentation', 'json-studio' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/privacy' ) ); ?>"><?php esc_html_e( 'Privacy Policy', 'json-studio' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/terms' ) ); ?>"><?php esc_html_e( 'Terms of Service', 'json-studio' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>"><?php esc_html_e( 'Contact', 'json-studio' ); ?></a></li>
						</ul>
					<?php endif; ?>
				</div>
			</div>

			<div class="footer-bottom">
				<div class="footer-copyright">
					<p>
						&copy; <?php echo esc_html( date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. 
						<?php esc_html_e( 'All rights reserved.', 'json-studio' ); ?>
					</p>
					<p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--color-text-secondary);">
						<?php esc_html_e( '🔒 Privacy First: All processing happens in your browser. No data is sent to servers. Your JSON stays private.', 'json-studio' ); ?>
					</p>
				</div>
				<?php
				if ( has_nav_menu( 'footer' ) ) {
					wp_nav_menu( array(
						'theme_location' => 'footer',
						'menu_id'        => 'footer-menu',
						'container'      => 'nav',
						'container_class' => 'footer-nav',
						'depth'          => 1,
					) );
				}
				?>
			</div>
		</div>
	</footer>
</div><!-- #page -->

<div id="toast-container" class="toast-container" aria-live="polite" aria-atomic="true"></div>

<?php wp_footer(); ?>

</body>
</html>

