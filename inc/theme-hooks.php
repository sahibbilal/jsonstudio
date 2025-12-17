<?php
/**
 * Theme Hooks
 * Additional hooks for theme customization
 *
 * @package JSONStudio
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add custom body classes
 */
function json_studio_custom_body_classes( $classes ) {
	// Add page template class
	if ( is_page_template() ) {
		$template = get_page_template_slug();
		$classes[] = 'template-' . sanitize_html_class( str_replace( '.php', '', basename( $template ) ) );
	}

	// Add tool page class
	if ( json_studio_is_tool_page() ) {
		$classes[] = 'json-tool-page';
	}

	return $classes;
}
add_filter( 'body_class', 'json_studio_custom_body_classes' );

/**
 * Add custom post classes
 */
function json_studio_custom_post_classes( $classes, $class, $post_id ) {
	if ( is_singular() ) {
		$classes[] = 'entry-singular';
	}

	return $classes;
}
add_filter( 'post_class', 'json_studio_custom_post_classes', 10, 3 );

/**
 * Custom excerpt length
 */
function json_studio_excerpt_length( $length ) {
	return 30;
}
add_filter( 'excerpt_length', 'json_studio_excerpt_length' );

/**
 * Custom excerpt more
 */
function json_studio_excerpt_more( $more ) {
	return '...';
}
add_filter( 'excerpt_more', 'json_studio_excerpt_more' );

/**
 * Add preconnect for performance
 */
function json_studio_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array(
			'href' => 'https://fonts.googleapis.com',
			'crossorigin',
		);
		$urls[] = array(
			'href' => 'https://fonts.gstatic.com',
			'crossorigin',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'json_studio_resource_hints', 10, 2 );

