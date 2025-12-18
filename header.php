<?php
/**
 * The header template
 *
 * @package JSONStudio
 * @since 1.0.0
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'json-studio' ); ?></a>

	<?php if ( ! is_front_page() ) : ?>
		<div class="top-bar">
			<div class="top-bar-container">
				<div class="top-bar-content">
					<div class="top-bar-left">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="top-bar-link">
							← <?php esc_html_e( 'Back to Home', 'json-studio' ); ?>
						</a>
					</div>
					<div class="top-bar-right">
						<!-- All tools are free -->
					</div>
				</div>
			</div>
		</div>
	<?php endif; ?>

	<header id="masthead" class="site-header">
		<div class="header-container">
			<div class="header-inner">
				<div class="site-branding">
					<?php
					if ( has_custom_logo() ) {
						the_custom_logo();
					} else {
						?>
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo" rel="home">
							<span class="site-title"><?php bloginfo( 'name' ); ?></span>
						</a>
						<?php
					}
					?>
				</div>

				<nav id="site-navigation" class="main-navigation" aria-label="<?php esc_attr_e( 'Primary Menu', 'json-studio' ); ?>">
					<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
						<span class="menu-toggle-icon">
							<span></span>
							<span></span>
							<span></span>
						</span>
						<span class="screen-reader-text"><?php esc_html_e( 'Primary Menu', 'json-studio' ); ?></span>
					</button>
					<?php
					wp_nav_menu( array(
						'theme_location' => 'primary',
						'menu_id'        => 'primary-menu',
						'container'      => false,
						'menu_class'     => 'nav-menu',
					) );
					?>
				</nav>

				<div class="header-actions">
					<div class="user-account">
						<?php if ( is_user_logged_in() ) : ?>
							<div class="user-menu">
								<button class="user-menu-toggle" aria-expanded="false">
									<span class="user-avatar">
										<?php echo get_avatar( get_current_user_id(), 32 ); ?>
									</span>
									<span class="user-name"><?php echo esc_html( wp_get_current_user()->display_name ); ?></span>
									<span class="dropdown-icon" aria-hidden="true">▼</span>
								</button>
								<ul class="user-menu-dropdown">
									<li><a href="<?php echo esc_url( admin_url( 'profile.php' ) ); ?>"><?php esc_html_e( 'Profile', 'json-studio' ); ?></a></li>
									<li><a href="<?php echo esc_url( wp_logout_url( home_url() ) ); ?>"><?php esc_html_e( 'Logout', 'json-studio' ); ?></a></li>
								</ul>
							</div>
						<?php else : ?>
							<a href="<?php echo esc_url( wp_login_url( home_url() ) ); ?>" class="btn btn-login">
								<?php esc_html_e( 'Login', 'json-studio' ); ?>
							</a>
							<a href="<?php echo esc_url( wp_registration_url() ); ?>" class="btn btn-register">
								<?php esc_html_e( 'Sign Up', 'json-studio' ); ?>
							</a>
						<?php endif; ?>
					</div>

					<button class="dark-mode-toggle" aria-label="<?php esc_attr_e( 'Toggle dark mode', 'json-studio' ); ?>">
						<span class="dark-mode-icon" aria-hidden="true">🌙</span>
						<span class="light-mode-icon" aria-hidden="true">☀️</span>
					</button>
				</div>
			</div>
		</div>

		<!-- All tools are free - no upgrade bar -->
	</header>

