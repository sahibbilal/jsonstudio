<?php
/**
 * JSON Studio Theme Functions
 *
 * @package JSONStudio
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Include theme hooks
require_once get_template_directory() . '/inc/theme-hooks.php';

/**
 * Theme Setup
 */
function json_studio_setup() {
	// Add theme support
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo', array(
		'height'      => 50,
		'width'       => 200,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'wp-block-styles' );

	// Register navigation menus
	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'json-studio' ),
		'footer'  => __( 'Footer Menu', 'json-studio' ),
	) );

	// Set content width
	$GLOBALS['content_width'] = 1200;
}
add_action( 'after_setup_theme', 'json_studio_setup' );

/**
 * Enqueue Scripts and Styles
 */
function json_studio_scripts() {
	$theme_version = wp_get_theme()->get( 'Version' );
	$suffix        = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

	// Styles
	wp_enqueue_style( 'json-studio-style', get_stylesheet_uri(), array(), $theme_version );
	wp_enqueue_style( 'json-studio-theme', get_template_directory_uri() . '/assets/css/theme.css', array(), $theme_version );

	// Scripts
	wp_enqueue_script( 'json-studio-main', get_template_directory_uri() . '/assets/js/main.js', array(), $theme_version, true );
	wp_enqueue_script( 'json-studio-dark-mode', get_template_directory_uri() . '/assets/js/dark-mode.js', array(), $theme_version, true );
	
	// Global Settings (Accessibility & Privacy) - Load on all pages
	wp_enqueue_script( 'json-studio-global-settings', get_template_directory_uri() . '/assets/js/build/global-settings.js', array(), $theme_version, true );
	if ( file_exists( get_template_directory() . '/assets/js/build/assets/main.css' ) ) {
		wp_enqueue_style( 'json-studio-global-settings-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
	}

	// Localize script for AJAX
	wp_localize_script( 'json-studio-main', 'jsonStudio', array(
		'ajaxUrl' => admin_url( 'admin-ajax.php' ),
		'nonce'   => wp_create_nonce( 'json-studio-nonce' ),
		'isPro'   => json_studio_is_pro_user(),
	) );

	// Enqueue CodeMirror for tool pages
	$tool_slug = json_studio_get_tool_slug();
	$is_tool_page = is_page_template( 'templates/tool-beautifier.php' ) || 
		 is_page_template( 'templates/tool-validator.php' ) || 
		 is_page_template( 'templates/tool-viewer.php' ) || 
		 is_page_template( 'templates/tool-converter.php' ) ||
		 is_page_template( 'templates/tool-diff-merge.php' ) ||
		 is_page_template( 'templates/tool-array-converter.php' ) ||
		 is_page_template( 'templates/tool-query-extractor.php' ) || 
		 is_page_template( 'templates/tool-schema-generator.php' ) || 
		 is_page_template( 'templates/tool-mock-data.php' ) ||
		 json_studio_is_tool_page();

	if ( $is_tool_page ) {
		
		// CodeMirror CSS and JS
		wp_enqueue_style( 'codemirror', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css', array(), '5.65.2' );
		wp_enqueue_style( 'codemirror-theme', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/material-darker.min.css', array( 'codemirror' ), '5.65.2' );
		wp_enqueue_script( 'codemirror', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js', array(), '5.65.2', true );
		wp_enqueue_script( 'codemirror-json', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js', array( 'codemirror' ), '5.65.2', true );
		wp_enqueue_script( 'codemirror-xml', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js', array( 'codemirror' ), '5.65.2', true );
		wp_enqueue_script( 'codemirror-yaml', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/yaml/yaml.min.js', array( 'codemirror' ), '5.65.2', true );
	}

	// Tool-specific scripts - React builds
	if ( is_page_template( 'templates/tool-beautifier.php' ) || $tool_slug === 'json-beautifier' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-beautifier', get_template_directory_uri() . '/assets/js/build/tool-beautifier.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-beautifier-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-validator.php' ) || $tool_slug === 'json-validator' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-validator', get_template_directory_uri() . '/assets/js/build/tool-validator.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-validator-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-viewer.php' ) || $tool_slug === 'json-viewer' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-viewer', get_template_directory_uri() . '/assets/js/build/tool-viewer.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-viewer-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-diff-merge.php' ) || $tool_slug === 'json-diff-merge' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-diff-merge', get_template_directory_uri() . '/assets/js/build/tool-diff-merge.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-diff-merge-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-array-converter.php' ) || $tool_slug === 'json-array-converter' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-array-converter', get_template_directory_uri() . '/assets/js/build/tool-array-converter.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-array-converter-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-converter.php' ) || $tool_slug === 'json-converter' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-converter', get_template_directory_uri() . '/assets/js/build/tool-converter.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-converter-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-query-extractor.php' ) || $tool_slug === 'json-query-extractor' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-query-extractor', get_template_directory_uri() . '/assets/js/build/tool-query-extractor.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-query-extractor-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-schema-generator.php' ) || $tool_slug === 'json-schema-generator' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-schema-generator', get_template_directory_uri() . '/assets/js/build/tool-schema-generator.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-schema-generator-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	if ( is_page_template( 'templates/tool-mock-data.php' ) || $tool_slug === 'json-mock-data' ) {
		// Enqueue React build
		wp_enqueue_script( 'json-studio-mock-data', get_template_directory_uri() . '/assets/js/build/tool-mock-data.js', array(), $theme_version, true );
		// CSS is included in the JS bundle, but we can also enqueue separately if needed
		$css_file = get_template_directory() . '/assets/js/build/assets/main.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style( 'json-studio-mock-data-css', get_template_directory_uri() . '/assets/js/build/assets/main.css', array(), $theme_version );
		}
	}

	// General editor script for other tool pages
	if ( is_page_template( 'templates/tool-page.php' ) ) {
		wp_enqueue_script( 'json-studio-editor', get_template_directory_uri() . '/assets/js/editor.js', array(), $theme_version, true );
	}

	// Comments
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'json_studio_scripts' );

/**
 * Register Widget Areas
 */
function json_studio_widgets_init() {
	register_sidebar( array(
		'name'          => __( 'Sidebar', 'json-studio' ),
		'id'            => 'sidebar-1',
		'description'   => __( 'Add widgets here.', 'json-studio' ),
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	) );

	register_sidebar( array(
		'name'          => __( 'Footer Column 1', 'json-studio' ),
		'id'            => 'footer-1',
		'description'   => __( 'Footer widget area.', 'json-studio' ),
		'before_widget' => '<div id="%1$s" class="widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
	) );

	register_sidebar( array(
		'name'          => __( 'Footer Column 2', 'json-studio' ),
		'id'            => 'footer-2',
		'description'   => __( 'Footer widget area.', 'json-studio' ),
		'before_widget' => '<div id="%1$s" class="widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
	) );

	register_sidebar( array(
		'name'          => __( 'Footer Column 3', 'json-studio' ),
		'id'            => 'footer-3',
		'description'   => __( 'Footer widget area.', 'json-studio' ),
		'before_widget' => '<div id="%1$s" class="widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3 class="widget-title">',
		'after_title'   => '</h3>',
	) );
}
add_action( 'widgets_init', 'json_studio_widgets_init' );

/**
 * Check if user has PRO access
 * All tools are now free - always return true
 */
function json_studio_is_pro_user() {
	return true; // All tools are free
}

/**
 * Get tool page slug
 */
function json_studio_get_tool_slug() {
	$slug = get_post_field( 'post_name', get_the_ID() );
	return $slug;
}

/**
 * Check if current page is a tool page
 */
function json_studio_is_tool_page() {
	$tool_pages = array(
		'json-beautifier',
		'json-validator',
		'json-viewer',
		'json-converter',
		'json-diff-merge',
		'json-schema-generator',
		'json-mock-data',
	);
	return in_array( json_studio_get_tool_slug(), $tool_pages, true );
}

/**
 * Check if tool requires PRO
 * All tools are now free - always return false
 */
function json_studio_tool_requires_pro( $tool_slug = '' ) {
	return false; // All tools are free
}

/**
 * Add SEO meta tags
 */
function json_studio_seo_meta() {
	if ( is_singular() ) {
		$description = get_post_meta( get_the_ID(), '_json_studio_meta_description', true );
		if ( empty( $description ) ) {
			$description = wp_trim_words( get_the_excerpt() ? get_the_excerpt() : get_the_content(), 30 );
		}
		?>
		<meta name="description" content="<?php echo esc_attr( $description ); ?>">
		<?php
	}
}
add_action( 'wp_head', 'json_studio_seo_meta' );

/**
 * Add structured data (JSON-LD)
 */
function json_studio_structured_data() {
	// Organization schema for homepage
	if ( is_front_page() ) {
		?>
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "<?php bloginfo( 'name' ); ?>",
			"url": "<?php echo esc_url( home_url( '/' ) ); ?>",
			"description": "<?php bloginfo( 'description' ); ?>",
			"sameAs": []
		}
		</script>
		<?php
	}

	// SoftwareApplication schema for tool pages
	if ( is_page_template( 'templates/tool-page.php' ) || json_studio_is_tool_page() ) {
		$tool_name = get_the_title();
		$tool_slug = json_studio_get_tool_slug();
		$tool_description = get_the_excerpt() ? get_the_excerpt() : get_the_content();
		?>
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "<?php echo esc_js( $tool_name ); ?>",
			"applicationCategory": "DeveloperApplication",
			"operatingSystem": "Web",
			"description": "<?php echo esc_js( wp_strip_all_tags( $tool_description ) ); ?>",
			"url": "<?php echo esc_url( get_permalink() ); ?>",
			"offers": {
				"@type": "Offer",
				"price": "Free",
				"priceCurrency": "USD"
			}
		}
		</script>
		<?php
	}

	// BreadcrumbList schema
	if ( ! is_front_page() && ! is_home() ) {
		$breadcrumbs = array(
			array(
				'@type'    => 'ListItem',
				'position' => 1,
				'name'     => 'Home',
				'item'     => home_url( '/' ),
			),
		);

		if ( is_singular() ) {
			$breadcrumbs[] = array(
				'@type'    => 'ListItem',
				'position' => 2,
				'name'     => get_the_title(),
				'item'     => get_permalink(),
			);
		}

		if ( count( $breadcrumbs ) > 1 ) {
			?>
			<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				"itemListElement": <?php echo wp_json_encode( $breadcrumbs ); ?>
			}
			</script>
			<?php
		}
	}
}
add_action( 'wp_head', 'json_studio_structured_data' );

/**
 * Add FAQ schema for documentation pages
 */
function json_studio_faq_schema() {
	if ( is_page() && has_shortcode( get_the_content(), 'faq' ) ) {
		// This would be populated by a FAQ shortcode or custom fields
		// Placeholder for FAQ schema integration
	}
}
add_action( 'wp_head', 'json_studio_faq_schema' );

/**
 * Customizer Settings
 */
function json_studio_customize_register( $wp_customize ) {
	// Colors Section
	$wp_customize->add_section( 'json_studio_colors', array(
		'title'    => __( 'Colors', 'json-studio' ),
		'priority' => 30,
	) );

	// Primary Color
	$wp_customize->add_setting( 'json_studio_primary_color', array(
		'default'           => '#4F46E5',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'json_studio_primary_color', array(
		'label'    => __( 'Primary Color', 'json-studio' ),
		'section'  => 'json_studio_colors',
		'settings' => 'json_studio_primary_color',
	) ) );

	// Secondary Color
	$wp_customize->add_setting( 'json_studio_secondary_color', array(
		'default'           => '#6366F1',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'json_studio_secondary_color', array(
		'label'    => __( 'Secondary Color', 'json-studio' ),
		'section'  => 'json_studio_colors',
		'settings' => 'json_studio_secondary_color',
	) ) );

	// Accent Color
	$wp_customize->add_setting( 'json_studio_accent_color', array(
		'default'           => '#FBBF24',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'json_studio_accent_color', array(
		'label'    => __( 'Accent Color', 'json-studio' ),
		'section'  => 'json_studio_colors',
		'settings' => 'json_studio_accent_color',
	) ) );
}
add_action( 'customize_register', 'json_studio_customize_register' );

/**
 * Output custom CSS from Customizer
 */
function json_studio_customizer_css() {
	$primary_color   = get_theme_mod( 'json_studio_primary_color', '#4F46E5' );
	$secondary_color = get_theme_mod( 'json_studio_secondary_color', '#6366F1' );
	$accent_color    = get_theme_mod( 'json_studio_accent_color', '#FBBF24' );
	?>
	<style type="text/css">
		:root {
			--color-primary: <?php echo esc_attr( $primary_color ); ?>;
			--color-secondary: <?php echo esc_attr( $secondary_color ); ?>;
			--color-accent: <?php echo esc_attr( $accent_color ); ?>;
		}
	</style>
	<?php
}
add_action( 'wp_head', 'json_studio_customizer_css' );


/**
 * Filter body classes
 */
function json_studio_body_classes( $classes ) {
	if ( json_studio_is_tool_page() ) {
		$classes[] = 'tool-page';
		$classes[] = 'tool-' . json_studio_get_tool_slug();
	}

	// All tools are free - no PRO locks

	return $classes;
}
add_filter( 'body_class', 'json_studio_body_classes' );

/**
 * Add type="module" to React build scripts
 */
function json_studio_add_module_type( $tag, $handle, $src ) {
	$module_scripts = array( 'json-studio-beautifier', 'json-studio-validator', 'json-studio-viewer', 'json-studio-converter', 'json-studio-diff-merge', 'json-studio-array-converter' );
	if ( in_array( $handle, $module_scripts, true ) ) {
		$tag = str_replace( '<script ', '<script type="module" ', $tag );
	}
	return $tag;
}
add_filter( 'script_loader_tag', 'json_studio_add_module_type', 10, 3 );

