<?php
/**
 * Template Name: Custom Login
 * Custom login page template
 *
 * @package JSONStudio
 * @since 1.0.0
 */

// Redirect if already logged in
if ( is_user_logged_in() ) {
	wp_redirect( home_url() );
	exit;
}

get_header();
?>

<main id="main" class="site-main login-page">
	<div class="login-container">
		<div class="login-box">
			<div class="login-header">
				<?php if ( has_custom_logo() ) : ?>
					<?php the_custom_logo(); ?>
				<?php else : ?>
					<h1 class="site-title"><?php bloginfo( 'name' ); ?></h1>
				<?php endif; ?>
				<p class="login-subtitle"><?php esc_html_e( 'Sign in to your account', 'json-studio' ); ?></p>
			</div>

			<div class="login-form-wrapper">
				<?php
				// Display login form
				$args = array(
					'redirect'       => home_url(),
					'form_id'        => 'loginform',
					'label_username' => __( 'Username or Email', 'json-studio' ),
					'label_password' => __( 'Password', 'json-studio' ),
					'label_remember' => __( 'Remember Me', 'json-studio' ),
					'label_log_in'   => __( 'Log In', 'json-studio' ),
					'id_username'    => 'user_login',
					'id_password'    => 'user_pass',
					'id_remember'    => 'rememberme',
					'id_submit'      => 'wp-submit',
					'remember'       => true,
					'value_username' => '',
					'value_remember' => false,
				);
				wp_login_form( $args );
				?>

				<div class="login-links">
					<a href="<?php echo esc_url( wp_lostpassword_url() ); ?>">
						<?php esc_html_e( 'Forgot Password?', 'json-studio' ); ?>
					</a>
					<span class="separator">|</span>
					<a href="<?php echo esc_url( wp_registration_url() ); ?>">
						<?php esc_html_e( 'Create Account', 'json-studio' ); ?>
					</a>
				</div>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();

