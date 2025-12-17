# JSON Studio WordPress Theme

A modern, professional WordPress theme for JSON Studio - offering Free and PRO JSON tools including Beautifier, Validator, Tree Viewer, Converters, JSON Schema Generator, Mock Data, API Access, and Batch Jobs.

## Features

- **Modern, Clean Design**: Developer-friendly UI with clean aesthetics
- **Fully Responsive**: Mobile-first design that works on all devices
- **Dark/Light Mode**: Toggle between themes with localStorage persistence
- **SEO Optimized**: Dynamic meta tags, structured data (JSON-LD), and semantic HTML
- **Performance Optimized**: Lazy loading, optimized assets, and best practices
- **Accessibility Ready**: Keyboard navigation, screen reader support, ARIA labels
- **PRO Integration**: Built-in hooks for PRO plugin functionality
- **Custom Templates**: Specialized templates for tool pages, landing page, login, and error pages
- **Theme Customizer**: Customize colors, fonts, and layout options
- **Gutenberg Compatible**: Fully compatible with WordPress block editor

## Installation

1. Upload the `json-studio` folder to `/wp-content/themes/`
2. Activate the theme through the 'Appearance' menu in WordPress
3. Configure theme options in Appearance > Customize

## Theme Structure

```
json-studio/
├── assets/
│   ├── css/
│   │   └── theme.css          # Main theme styles
│   └── js/
│       ├── main.js            # Main JavaScript
│       ├── dark-mode.js      # Dark mode toggle
│       └── editor.js         # JSON editor enhancements
├── templates/
│   ├── front-page.php        # Landing page template
│   ├── tool-page.php         # Tool page template
│   ├── login.php             # Custom login template
│   └── maintenance.php       # Maintenance mode template
├── functions.php             # Theme functions and hooks
├── header.php                # Header template
├── footer.php                # Footer template
├── index.php                 # Main template
├── page.php                  # Page template
├── single.php                # Single post template
├── archive.php               # Archive template
├── 404.php                   # 404 error page
├── style.css                 # Theme stylesheet (header)
└── README.md                 # This file
```

## Tool Pages

The theme supports the following tool pages:

### Free Tools
- `/json-beautifier` - JSON Beautifier
- `/json-validator` - JSON Validator
- `/json-viewer` - JSON Tree Viewer

### PRO Tools
- `/json-converter` - JSON Converter
- `/json-diff-merge` - JSON Diff & Merge
- `/json-schema-generator` - JSON Schema Generator
- `/json-mock-data` - Mock Data Generator
- `/api-dashboard` - API Dashboard

## Customization

### Colors

Customize theme colors in **Appearance > Customize > Colors**:
- Primary Color (default: #4F46E5)
- Secondary Color (default: #6366F1)
- Accent Color (default: #FBBF24)

### Navigation Menus

Register navigation menus in **Appearance > Menus**:
- Primary Menu (header navigation)
- Footer Menu (footer links)

### Widget Areas

Available widget areas:
- Sidebar
- Footer Column 1
- Footer Column 2
- Footer Column 3

## Integration with PRO Plugin

The theme includes hooks for PRO plugin integration:

```php
// Check if user has PRO access
json_studio_is_pro_user()

// Check if tool requires PRO
json_studio_tool_requires_pro($tool_slug)

// Get current tool slug
json_studio_get_tool_slug()
```

## Shortcodes

### Tool Shortcode

Display a JSON tool anywhere:

```
[json_tool tool="json-beautifier" type="editor"]
```

Parameters:
- `tool` - Tool slug (required)
- `type` - Tool type (default: "editor")

## Hooks

### Action Hooks

- `json_studio_tool_options` - Add custom options to tool sidebar
- `json_studio_after_tool_content` - Content after tool editor

### Filter Hooks

- `json_studio_tool_requires_pro` - Filter PRO requirement for tools
- `json_studio_body_classes` - Add custom body classes

## JavaScript API

The theme exposes a global `jsonStudio` object:

```javascript
// Check PRO status
jsonStudio.isPro

// AJAX URL
jsonStudio.ajaxUrl

// Nonce for AJAX requests
jsonStudio.nonce

// Process tool
jsonStudio.processTool(toolSlug, input, output)

// Initialize tool
jsonStudio.initTool(toolSlug)
```

## Toast Notifications

Show toast notifications:

```javascript
showToast('Message', 'success'); // success, error, warning, info
```

## Dark Mode

Dark mode is automatically saved to localStorage. Users can toggle via the header button.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Requirements

- WordPress 6.0+
- PHP 8.0+
- Modern browser with JavaScript enabled

## Performance

- Optimized CSS and JavaScript
- Lazy loading for tool editors
- Minimal external dependencies
- Efficient asset enqueuing

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- ARIA labels and roles
- Skip links

## SEO Features

- Dynamic meta descriptions
- Structured data (JSON-LD)
- Semantic HTML5
- Optimized heading hierarchy
- Open Graph ready

## Support

For support, documentation, and updates, visit the theme's documentation page.

## License

GPL v2 or later

## Changelog

### 1.0.0
- Initial release
- All core features implemented
- Dark mode support
- PRO integration hooks
- Custom templates
- SEO optimization

