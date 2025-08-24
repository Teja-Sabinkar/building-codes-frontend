// src/components/home/RegulationPanel/RegionSelector.js - UPDATED WITH DUBAI SUPPORT & ALPHABETICAL SORTING
'use client';

import React, { useState } from 'react';
import styles from './RegionSelector.module.css';

const RegionSelector = ({ isOpen, onRegionSelect, onCancel }) => {
  const [selectedCountry, setSelectedCountry] = useState('');

  // ðŸ"¥ UPDATED: Added Dubai with flag and building code documents
  const countries = [
    {
      country: 'India',
      countryName: 'India',
      codes: [
        {
          code: 'India',
          name: 'Indian Building Codes',
          documents: [
            'NBC 2016-VOL.1',
            'NBC 2016-VOL.2'
          ]
        }
      ]
    },
    {
      country: 'Scotland',
      countryName: 'Scotland',
      codes: [
        {
          code: 'Scotland',
          name: 'Scottish Building Standards',
          documents: [
            'Building standards technical handbook January 2025 domestic',
            'Building standards technical handbook January 2025 non-domestic',
            'Single-building-assessment-specification-sba',
            'Standards-single-building-assessments-additional-work-assessments',
            'Task-group-recommendations-march-2024',
            'Determining-fire-risk-posed-external-wall-systems-existing-multistorey-residential-buildings',
            'Draft-scottish-advice-note-external-wall-systems-version-3-0'
          ]
        }
      ]
    },
    {
      country: 'Dubai',
      countryName: 'Dubai',
      codes: [
        {
          code: 'Dubai',
          name: 'Dubai Building Code',
          documents: [
            'Dubai Building Code English 2021 Edition'
          ]
        }
      ]
    }
  ].sort((a, b) => a.countryName.localeCompare(b.countryName)); // Sort alphabetically by country name

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
  };

  const handleCreateConversation = (codeData) => {
    if (codeData) {
      onRegionSelect(codeData);
      setSelectedCountry(''); // Reset for next time
    }
  };

  if (!isOpen) return null;

  const selectedCountryData = countries.find(c => c.country === selectedCountry);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Select Building Code Region</h3>
          <p>Choose the country and building codes for this conversation</p>
        </div>

        <div className={styles.regionSelector}>
          <label htmlFor="country-select" className={styles.selectLabel}>
            Select Country:
          </label>
          <select 
            id="country-select"
            value={selectedCountry}
            onChange={handleCountryChange}
            className={styles.regionDropdown}
          >
            <option value="">Choose a country...</option>
            {countries.map(country => (
              <option key={country.country} value={country.country}>
                {country.flag} {country.countryName}
              </option>
            ))}
          </select>

          {selectedCountryData && (
            <div className={styles.regionDetails}>
              <h4>{selectedCountryData.flag} Available Building Codes for {selectedCountryData.countryName}</h4>
              <div className={styles.codesContainer}>
                {selectedCountryData.codes.map((codeData, index) => (
                  <div key={index} className={styles.codeCard}>
                    <div className={styles.codeHeader}>
                      <h5>{codeData.name}</h5>
                    </div>
                    <div className={styles.codeStats}>
                      <div className={styles.documentsSection}>
                        <span className={styles.documentsLabel}>Available Documents:</span>
                        <ul className={styles.documentsList}>
                          {codeData.documents.map((doc, docIndex) => (
                            <li key={docIndex} className={styles.documentItem}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCreateConversation(codeData)}
                      className={styles.selectCodeButton}
                    >
                      Select {codeData.name}
                    </button>
                  </div>
                ))}
              </div>
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
        </div>







        
      </div>
    </div>
  );
};

export default RegionSelector;