// src/components/home/RegulationPanel/RegionSelector.js
'use client';

import React, { useState } from 'react';
import styles from './RegionSelector.module.css';

const RegionSelector = ({ isOpen, onRegionSelect, onCancel }) => {
  const [selectedRegion, setSelectedRegion] = useState('');

  const regions = [
    {
      code: 'India',
      name: 'Indian Building Codes',
      flag: '🇮🇳',
      description: 'National Building Code 2016 (NBC)',
      chunks: '2,252 chunks available',
      documents: 'NBC 2016-VOL.1 & VOL.2'
    },
    {
      code: 'Scotland',
      name: 'Scottish Building Standards', 
      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      description: 'Building Standards Technical Handbook 2025',
      chunks: '55 chunks available',
      documents: 'BSTH Jan2025 Domestic & Non-Domestic'
    }
  ];

  const handleRegionChange = (event) => {
    setSelectedRegion(event.target.value);
  };

  const handleCreateConversation = () => {
    if (selectedRegion) {
      const regionData = regions.find(r => r.code === selectedRegion);
      onRegionSelect(regionData);
      setSelectedRegion(''); // Reset for next time
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Select Building Code Region</h3>
          <p>Choose the building codes region for this conversation</p>
        </div>

        <div className={styles.regionSelector}>
          <label htmlFor="region-select" className={styles.selectLabel}>
            Building Code Region:
          </label>
          <select 
            id="region-select"
            value={selectedRegion}
            onChange={handleRegionChange}
            className={styles.regionDropdown}
          >
            <option value="">Choose a region...</option>
            {regions.map(region => (
              <option key={region.code} value={region.code}>
                {region.flag} {region.name}
              </option>
            ))}
          </select>

          {selectedRegion && (
            <div className={styles.regionDetails}>
              {(() => {
                const region = regions.find(r => r.code === selectedRegion);
                return (
                  <div className={styles.regionInfo}>
                    <h4>{region.flag} {region.name}</h4>
                    <p>{region.description}</p>
                    <div className={styles.regionStats}>
                      <span className={styles.chunks}>{region.chunks}</span>
                      <span className={styles.documents}>{region.documents}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button 
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateConversation}
            disabled={!selectedRegion}
            className={styles.createButton}
          >
            Create Conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegionSelector;