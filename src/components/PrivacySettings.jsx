import React, { useState, useEffect } from 'react';

const PrivacySettings = () => {
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [storedData, setStoredData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    updateStoredDataList();
  }, []);

  const updateStoredDataList = () => {
    const data = {};
    const keys = ['theme', 'fontSize', 'highContrast', 'upgradeBarDismissed'];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = {
          value,
          purpose: getDataPurpose(key),
          type: getDataType(key)
        };
      }
    });
    
    setStoredData(data);
  };

  const getDataPurpose = (key) => {
    const purposes = {
      'theme': 'Stores your dark/light mode preference for better user experience',
      'fontSize': 'Stores your font size preference for accessibility',
      'highContrast': 'Stores your high contrast mode preference for accessibility',
      'upgradeBarDismissed': 'Remembers that you dismissed the upgrade notification (legacy)'
    };
    return purposes[key] || 'Unknown purpose';
  };

  const getDataType = (key) => {
    const types = {
      'theme': 'Preference (light/dark)',
      'fontSize': 'Preference (small/medium/large/xlarge)',
      'highContrast': 'Preference (true/false)',
      'upgradeBarDismissed': 'UI State (true/false)'
    };
    return types[key] || 'Unknown';
  };

  const deleteAllData = () => {
    const keys = Object.keys(storedData);
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    setStoredData({});
    setShowDeleteConfirm(false);
    setShowPrivacyPanel(false);
    
    // Show success message
    if (window.showToast) {
      window.showToast('All local data has been deleted', 'success');
    } else {
      alert('All local data has been deleted');
    }
    
    // Reload page to reset to defaults
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const deleteSpecificData = (key) => {
    localStorage.removeItem(key);
    updateStoredDataList();
    
    if (window.showToast) {
      window.showToast(`Deleted ${key} preference`, 'success');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
        aria-label="Privacy and data settings"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'var(--color-info, #3B82F6)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1.2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          visibility: 'visible'
        }}
        title="Privacy & Data Settings"
      >
        🔒
      </button>

      {showPrivacyPanel && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          overflowY: 'auto',
          zIndex: 10001
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Privacy & Data Settings</h3>
            <button
              onClick={() => setShowPrivacyPanel(false)}
              aria-label="Close privacy settings"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--color-text)'
              }}
            >
              ×
            </button>
          </div>

          {/* Privacy Message */}
          <div style={{
            marginBottom: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)' }}>
              ✓ Your Privacy Matters
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <strong>No Hidden Data Retention:</strong> We only store your preferences locally in your browser. 
              No data is sent to our servers. All processing happens in your browser.
            </p>
          </div>

          {/* Data Scope Transparency */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600 }}>
              Data Scope Transparency
            </h4>
            <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              The following data is stored locally in your browser:
            </p>
            
            {Object.keys(storedData).length === 0 ? (
              <p style={{ margin: 'var(--spacing-sm) 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                No data currently stored.
              </p>
            ) : (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                {Object.entries(storedData).map(([key, info]) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 'var(--spacing-sm)',
                      padding: 'var(--spacing-sm)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xs)' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>
                          {key}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                          {info.type}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSpecificData(key)}
                        aria-label={`Delete ${key} data`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          padding: '2px 6px'
                        }}
                        title={`Delete ${key}`}
                      >
                        ✕
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {info.purpose}
                    </p>
                    <code style={{
                      display: 'block',
                      marginTop: '4px',
                      fontSize: '0.65rem',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'monospace'
                    }}>
                      Value: {info.value}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User-Controlled Deletion */}
          <div style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-warning-bg, rgba(245, 158, 11, 0.1))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-warning, #F59E0B)'
          }}>
            <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.875rem', fontWeight: 600 }}>
              User-Controlled Deletion
            </h4>
            <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              You have full control over your data. Delete individual items above or delete all data at once.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  marginTop: 'var(--spacing-sm)',
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  backgroundColor: 'var(--color-error)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                Delete All Local Data
              </button>
            ) : (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 600 }}>
                  Are you sure? This will delete all stored preferences and reset the app to defaults.
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                  <button
                    onClick={deleteAllData}
                    style={{
                      padding: 'var(--spacing-xs) var(--spacing-md)',
                      backgroundColor: 'var(--color-error)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Yes, Delete All
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: 'var(--spacing-xs) var(--spacing-md)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Privacy Info */}
          <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              <strong>Note:</strong> All JSON processing happens entirely in your browser. 
              Your JSON data is never sent to any server. We don't track, store, or analyze your content.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivacySettings;

