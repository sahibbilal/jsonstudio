<?php
/**
 * The template for displaying comments
 *
 * @package JSONStudio
 * @since 1.0.0
 */

if ( post_password_required() ) {
	return;
}
?>

<div id="comments" class="comments-area">
	<?php if ( have_comments() ) : ?>
		<h2 class="comments-title">
			<?php
			$comment_count = get_comments_number();
			if ( '1' === $comment_count ) {
				printf(
					/* translators: 1: title. */
					esc_html__( 'One thought on &ldquo;%1$s&rdquo;', 'json-studio' ),
					'<span>' . wp_kses_post( get_the_title() ) . '</span>'
				);
			} else {
				printf(
					/* translators: 1: comment count number, 2: title. */
					esc_html( _nx( '%1$s thought on &ldquo;%2$s&rdquo;', '%1$s thoughts on &ldquo;%2$s&rdquo;', $comment_count, 'comments title', 'json-studio' ) ),
					number_format_i18n( $comment_count ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					'<span>' . wp_kses_post( get_the_title() ) . '</span>'
				);
			}
			?>
		</h2>

		<ol class="comment-list">
			<?php
			wp_list_comments( array(
				'style'      => 'ol',
				'short_ping' => true,
			) );
			?>
		</ol>

		<?php
		the_comments_pagination( array(
			'prev_text' => esc_html__( 'Previous', 'json-studio' ),
			'next_text' => esc_html__( 'Next', 'json-studio' ),
		) );
		?>

	<?php endif; ?>

	<?php
	comment_form( array(
		'title_reply'        => esc_html__( 'Leave a Reply', 'json-studio' ),
		'title_reply_to'     => esc_html__( 'Leave a Reply to %s', 'json-studio' ),
		'cancel_reply_link'  => esc_html__( 'Cancel Reply', 'json-studio' ),
		'label_submit'       => esc_html__( 'Post Comment', 'json-studio' ),
	) );
	?>
</div>

