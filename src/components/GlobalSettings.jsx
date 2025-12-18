import React from 'react';
import AccessibilitySettings from './AccessibilitySettings';
import PrivacySettings from './PrivacySettings';

/**
 * Global Settings Component
 * Combines Accessibility and Privacy settings for all pages
 */
const GlobalSettings = () => {
  return (
    <>
      <AccessibilitySettings />
      <PrivacySettings />
    </>
  );
};

export default GlobalSettings;

