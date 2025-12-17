<?php
/**
 * Template Name: Landing Page
 * Front page template with hero and tool cards
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();
?>

<main id="main" class="site-main front-page">
	<!-- Hero Section -->
	<section class="hero-section">
		<div class="container">
			<div class="hero-content">
				<h1 class="hero-title">
					<?php esc_html_e( 'Beautify, Validate & Convert JSON', 'json-studio' ); ?>
					<span class="hero-subtitle"><?php esc_html_e( 'Free & PRO Tools', 'json-studio' ); ?></span>
				</h1>
				<p class="hero-description">
					<?php esc_html_e( 'Powerful JSON tools for developers. Format, validate, convert, and work with JSON data effortlessly.', 'json-studio' ); ?>
				</p>
				<div class="hero-actions">
					<a href="<?php echo esc_url( home_url( '/json-beautifier' ) ); ?>" class="btn btn-primary btn-lg">
						<?php esc_html_e( 'Get Started Free', 'json-studio' ); ?>
					</a>
					<?php if ( ! json_studio_is_pro_user() ) : ?>
						<a href="<?php echo esc_url( home_url( '/upgrade' ) ); ?>" class="btn btn-secondary btn-lg">
							<?php esc_html_e( 'Upgrade to PRO', 'json-studio' ); ?>
						</a>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</section>

	<!-- Tools Grid Section -->
	<section class="tools-section">
		<div class="container">
			<h2 class="section-title"><?php esc_html_e( 'Our Tools', 'json-studio' ); ?></h2>
			<p class="section-description"><?php esc_html_e( 'Choose from our collection of free and premium JSON tools', 'json-studio' ); ?></p>

			<div class="tools-grid">
				<!-- JSON Beautifier -->
				<div class="tool-card">
					<div class="tool-card-header">
						<span class="tool-icon">✨</span>
						<span class="tool-badge tool-badge-free">FREE</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Beautifier', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Format and beautify your JSON code with proper indentation and syntax highlighting.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/json-beautifier' ) ); ?>" class="tool-card-link">
						<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
					</a>
				</div>

				<!-- JSON Validator -->
				<div class="tool-card">
					<div class="tool-card-header">
						<span class="tool-icon">✓</span>
						<span class="tool-badge tool-badge-free">FREE</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Validator', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Validate JSON syntax and structure. Find errors and fix them quickly.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/json-validator' ) ); ?>" class="tool-card-link">
						<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
					</a>
				</div>

				<!-- JSON Viewer -->
				<div class="tool-card">
					<div class="tool-card-header">
						<span class="tool-icon">👁️</span>
						<span class="tool-badge tool-badge-free">FREE</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Tree Viewer', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Visualize JSON data in an interactive tree structure. Navigate and explore easily.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/json-viewer' ) ); ?>" class="tool-card-link">
						<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
					</a>
				</div>

				<!-- JSON Converter -->
				<div class="tool-card">
					<div class="tool-card-header">
						<span class="tool-icon">🔄</span>
						<span class="tool-badge tool-badge-free">FREE</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Converter', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Convert JSON to XML, CSV, YAML, and more formats. Batch conversion supported.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/json-converter' ) ); ?>" class="tool-card-link">
						<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
					</a>
				</div>

				<!-- JSON Diff & Merge -->
				<div class="tool-card">
					<div class="tool-card-header">
						<span class="tool-icon">🔀</span>
						<span class="tool-badge tool-badge-free">FREE</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Diff & Merge', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Compare two JSON files and merge them intelligently. See differences highlighted.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/json-diff-merge' ) ); ?>" class="tool-card-link">
						<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
					</a>
				</div>

				<!-- JSON Array Converter -->
				<div class="tool-card">
					<div class="tool-card-header">
						<span class="tool-icon">📊</span>
						<span class="tool-badge tool-badge-free">FREE</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Array Converter', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Convert JSON objects to arrays and arrays back to JSON. Bidirectional conversion with nested support.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/json-array-converter' ) ); ?>" class="tool-card-link">
						<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
					</a>
				</div>

				<!-- JSON Schema Generator (PRO) -->
				<div class="tool-card tool-card-pro">
					<div class="tool-card-header">
						<span class="tool-icon">📋</span>
						<span class="tool-badge tool-badge-pro">PRO</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'JSON Schema Generator', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Generate JSON Schema from your JSON data. Validate and document your data structures.', 'json-studio' ); ?></p>
					<?php if ( json_studio_is_pro_user() ) : ?>
						<a href="<?php echo esc_url( home_url( '/json-schema-generator' ) ); ?>" class="tool-card-link">
							<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
						</a>
					<?php else : ?>
						<a href="<?php echo esc_url( home_url( '/upgrade' ) ); ?>" class="tool-card-link">
							<?php esc_html_e( 'Upgrade to PRO', 'json-studio' ); ?> →
						</a>
					<?php endif; ?>
				</div>

				<!-- Mock Data Generator (PRO) -->
				<div class="tool-card tool-card-pro">
					<div class="tool-card-header">
						<span class="tool-icon">🎲</span>
						<span class="tool-badge tool-badge-pro">PRO</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'Mock Data Generator', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Generate realistic mock JSON data for testing. Customize fields and data types.', 'json-studio' ); ?></p>
					<?php if ( json_studio_is_pro_user() ) : ?>
						<a href="<?php echo esc_url( home_url( '/json-mock-data' ) ); ?>" class="tool-card-link">
							<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
						</a>
					<?php else : ?>
						<a href="<?php echo esc_url( home_url( '/upgrade' ) ); ?>" class="tool-card-link">
							<?php esc_html_e( 'Upgrade to PRO', 'json-studio' ); ?> →
						</a>
					<?php endif; ?>
				</div>

				<!-- API Dashboard (PRO) -->
				<div class="tool-card tool-card-pro">
					<div class="tool-card-header">
						<span class="tool-icon">🔌</span>
						<span class="tool-badge tool-badge-pro">PRO</span>
					</div>
					<h3 class="tool-card-title"><?php esc_html_e( 'API Dashboard', 'json-studio' ); ?></h3>
					<p class="tool-card-description"><?php esc_html_e( 'Access all tools via REST API. Manage API keys, view usage stats, and batch jobs.', 'json-studio' ); ?></p>
					<?php if ( json_studio_is_pro_user() ) : ?>
						<a href="<?php echo esc_url( home_url( '/api-dashboard' ) ); ?>" class="tool-card-link">
							<?php esc_html_e( 'Use Tool', 'json-studio' ); ?> →
						</a>
					<?php else : ?>
						<a href="<?php echo esc_url( home_url( '/upgrade' ) ); ?>" class="tool-card-link">
							<?php esc_html_e( 'Upgrade to PRO', 'json-studio' ); ?> →
						</a>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features-section">
		<div class="container">
			<h2 class="section-title"><?php esc_html_e( 'Why Choose JSON Studio?', 'json-studio' ); ?></h2>
			<div class="features-grid">
				<div class="feature-item">
					<span class="feature-icon">⚡</span>
					<h3><?php esc_html_e( 'Fast & Reliable', 'json-studio' ); ?></h3>
					<p><?php esc_html_e( 'Process JSON data quickly with our optimized tools.', 'json-studio' ); ?></p>
				</div>
				<div class="feature-item">
					<span class="feature-icon">🔒</span>
					<h3><?php esc_html_e( 'Privacy First', 'json-studio' ); ?></h3>
					<p><?php esc_html_e( 'All processing happens client-side. Your data stays private.', 'json-studio' ); ?></p>
				</div>
				<div class="feature-item">
					<span class="feature-icon">📱</span>
					<h3><?php esc_html_e( 'Fully Responsive', 'json-studio' ); ?></h3>
					<p><?php esc_html_e( 'Works seamlessly on desktop, tablet, and mobile devices.', 'json-studio' ); ?></p>
				</div>
				<div class="feature-item">
					<span class="feature-icon">🎨</span>
					<h3><?php esc_html_e( 'Modern UI', 'json-studio' ); ?></h3>
					<p><?php esc_html_e( 'Clean, intuitive interface with dark mode support.', 'json-studio' ); ?></p>
				</div>
			</div>
		</div>
	</section>

	<?php if ( ! json_studio_is_pro_user() ) : ?>
		<!-- CTA Section -->
		<section class="cta-section">
			<div class="container">
				<div class="cta-content">
					<h2><?php esc_html_e( 'Ready to unlock PRO features?', 'json-studio' ); ?></h2>
					<p><?php esc_html_e( 'Get unlimited access to all tools, API access, batch processing, and priority support.', 'json-studio' ); ?></p>
					<a href="<?php echo esc_url( home_url( '/upgrade' ) ); ?>" class="btn btn-primary btn-lg">
						<?php esc_html_e( 'Upgrade to PRO', 'json-studio' ); ?>
					</a>
				</div>
			</div>
		</section>
	<?php endif; ?>
</main>

<?php
get_footer();

