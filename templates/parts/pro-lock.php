<?php
/**
 * Template part for PRO lock modal
 *
 * @package JSONStudio
 * @since 1.0.0
 */
?>

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

