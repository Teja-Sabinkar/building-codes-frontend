// src/components/settings/SettingsLayout.js
import styles from './SettingsLayout.module.css';

export default function SettingsLayout({ children }) {
  return (
    <div className={styles.settingsLayout}>
      <div className={styles.contentContainer}>
        {children}
      </div>
    </div>
  );
}