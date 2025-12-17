<?php
/**
 * Template for displaying search form
 *
 * @package JSONStudio
 * @since 1.0.0
 */
?>

<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label for="search-field" class="screen-reader-text">
		<?php esc_html_e( 'Search for:', 'json-studio' ); ?>
	</label>
	<input 
		type="search" 
		id="search-field" 
		class="search-field" 
		placeholder="<?php esc_attr_e( 'Search...', 'json-studio' ); ?>" 
		value="<?php echo get_search_query(); ?>" 
		name="s" 
		required
	/>
	<button type="submit" class="search-submit" aria-label="<?php esc_attr_e( 'Search', 'json-studio' ); ?>">
		<span class="screen-reader-text"><?php esc_html_e( 'Search', 'json-studio' ); ?></span>
		🔍
	</button>
</form>

