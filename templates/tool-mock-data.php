<?php
/**
 * Template Name: Mock Data Generator Tool
 * Template for Mock Data Generator
 *
 * @package JSONStudio
 * @since 1.0.0
 */

get_header();

$tool_slug = 'json-mock-data';
// All tools are free
?>

<main id="main" class="site-main tool-page-main tool-mock-data">
	<div class="tool-page-header">
		<div class="container">
			<div class="tool-header-content">
				<h1 class="tool-title"><?php the_title(); ?></h1>
			</div>
		</div>
	</div>

	<div class="tool-page-content">
		<div class="container">
			<div class="tool-layout">
				<!-- React App Container -->
				<div id="json-mock-data-generator-root"></div>
			</div>
		</div>
	</div>
</main>

<?php
get_footer();

