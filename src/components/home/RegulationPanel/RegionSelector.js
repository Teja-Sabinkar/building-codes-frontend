// src/components/home/RegulationPanel/RegionSelector.js - UPDATED WITH INDIA 7 CATEGORIES
'use client';

import React, { useState } from 'react';
import styles from './RegionSelector.module.css';

const RegionSelector = ({ isOpen, onRegionSelect, onCancel }) => {
  const [selectedCountry, setSelectedCountry] = useState('');

  // Updated: India now has organized categories with one selection
  const countries = [
    {
      country: 'India',
      countryName: 'India',
      codes: [
        {
          code: 'India',
          name: 'Indian Building Codes & Structural Engineering Standards',
          categories: [
            {
              categoryName: 'Building Regulations',
              documents: [
                'NBC 2016-VOL.1',
                'NBC 2016-VOL.2'
              ]
            },
            {
              categoryName: 'Bridges & Special Structures',
              documents: [
                'IRC 006-2017 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE',
                'IRC 021-2000 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE FOR ROAD BRIDGES',
                'IRC 078-2000 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE FOR ROAD BRIDGES',
                'IS 3370 (Part 1)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
                'IS 4995 (Part 1)-1974 - CRITERIA FOR DESIGN OF REINFORCED CONCRETE BINS FOR THE STORAGE OF GRANULAR AND POWDER'
              ]
            },
            {
              categoryName: 'Concrete Structures',
              documents: [
                'IS 10262-2009 - GUIDELINES FOR CONCRETE MIX PROPORTIONING',
                'IS 1343-2012 - CODE OF PRACTICE FOR PRESTRESSED CONCRETE',
                'IS 3370 (Part 1)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
                'IS 3370 (Part 2)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
                'IS 3370 (Part 3)-1967 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
                'IS 3370 (Part 4)-1967 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
                'IS 456-2000 - CODE OF PRACTICE FOR PLAIN AND REINFORCED CONCRETE',
                'IS 875 (Part 1)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
                'IS 875 (Part 2)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
                'IS 875 (Part 3)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
                'IS 875 (Part 4)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
                'IS 875 (Part 5)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES'
              ]
            },
            {
              categoryName: 'Earthquake & Wind',
              documents: [
                'IS 13920-1993 - CODE OF PRACTICE FOR DUCTILE DETAILING OF REINFORCED CONCRETE STRUCTURES SUBJECTED TO SEISMIC FORCES',
                'IS 1893 (Part 1)-2016 - CRITERIA FOR EARTHQUAKE RESISTANT DESIGN OF STRUCTURES',
                'IS 4326-2013 - CODE OF PRACTICE FOR EARTHQUAKE RESISTANT DESIGN AND CONSTRUCTION OF BUILDINGS',
                'IS 875 (Part 3)-2015 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES'
              ]
            },
            {
              categoryName: 'Foundation & Soils',
              documents: [
                'IS 2911 (Part 1.1)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
                'IS 2911 (Part 1.2)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
                'IS 2911 (Part 1.3)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
                'IS 2911 (Part 1.4)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
                'IS 2950 (Part 1.1)-1981 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF RAFT FOUNDATIONS',
                'IS 6403-1981 - CODE OF PRACTICE FOR DETERMINATION OF BREAKING CAPACITY OF SHALLOW FOUNDATIONS',
                'IS 1904-1986 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF FOUNDATIONS IN SOILS GENERAL REQUIREMENTS'
              ]
            },
            {
              categoryName: 'Masonry & Timber',
              documents: [
                'IS 1905-1987 - CODE OF PRACTICE FOR STRUCTURAL USE OF UNREINFORCED MASONRY',
                'IS 2212-1991 - CODE OF PRACTICE FOR BRICK WORKS',
                'IS 883-1994 - CODE OF PRACTICE FOR DESIGN OF STRUCTURAL TIMBER IN BUILDING',
                'IS SP 20-1991 - HANDBOOK ON MASONRY DESIGN AND CONSTRUCTION'
              ]
            },
            {
              categoryName: 'Steel Structures',
              documents: [
                'IS 4923-1997 - SPECIFICATION FOR HOLLOW STEEL SECTIONS FOR STRUCTURAL USE',
                'IS 800-2007 - CODE OF PRACTICE FOR GENERAL CONSTRUCTION IN STEEL',
                'IS 801-1975 - CODE OF PRACTICE FOR USE OF COLD-FORMED LIGHT GAUGE STEEL STRUCTURAL MEMBERS IN GENERAL BUILDING CONSTRUCTION',
                'IS 806-1968 - CODE OF PRACTICE FOR USE OF STEEL TUBES IN GENERAL BUILDING CONSTRUCTION',
                'IS 875 (Part 3)-2015 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES'
              ]
            }
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
                      {codeData.categories ? (
                        // India with categories
                        codeData.categories.map((category, catIndex) => (
                          <div key={catIndex} className={styles.categorySection}>
                            <h6 className={styles.categoryTitle}>{category.categoryName}</h6>
                            <div className={styles.documentsSection}>
                              <span className={styles.documentsLabel}>Available Documents:</span>
                              <ul className={styles.documentsList}>
                                {category.documents.map((doc, docIndex) => (
                                  <li key={docIndex} className={styles.documentItem}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Other countries with simple documents list
                        <div className={styles.documentsSection}>
                          <span className={styles.documentsLabel}>Available Documents:</span>
                          <ul className={styles.documentsList}>
                            {codeData.documents.map((doc, docIndex) => (
                              <li key={docIndex} className={styles.documentItem}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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