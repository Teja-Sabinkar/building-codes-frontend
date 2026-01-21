// src/lib/documentMappings.js
// Central configuration for PDF browse feature
// Contains document organization by region with categories

/**
 * Document structure for each region
 * - India: 7 categories with 39 documents
 * - Scotland: 3 categories with 7 documents  
 * - Dubai: 1 category with 1 document
 */
export const DOCUMENT_CATEGORIES = {
  India: {
    categories: [
      {
        name: 'Building Regulations',
        icon: 'building',
        documents: [
          {
            displayName: 'NBC 2016 Volume 1',
            documentName: 'NBC 2016-VOL.1',
            pageCount: 600,
            pdfFilename: 'NBC 2016-VOL.1.pdf',
            icon: 'document'
          },
          {
            displayName: 'NBC 2016 Volume 2',
            documentName: 'NBC 2016-VOL.2',
            pageCount: 550,
            pdfFilename: 'NBC 2016-VOL.2.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Bridges & Special Structures',
        icon: 'bridge',
        documents: [
          {
            displayName: 'IRC 006-2017 - Standard Specifications',
            documentName: 'IRC 006-2017 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE',
            pageCount: 450,
            pdfFilename: 'IRC 006-2017 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE.pdf',
            icon: 'document'
          },
          {
            displayName: 'IRC 021-2000 - Road Bridges',
            documentName: 'IRC 021-2000 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE FOR ROAD BRIDGES',
            pageCount: 380,
            pdfFilename: 'IRC 021-2000 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE FOR ROAD BRIDGES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IRC 078-2000 - Road Bridges',
            documentName: 'IRC 078-2000 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE FOR ROAD BRIDGES',
            pageCount: 420,
            pdfFilename: 'IRC 078-2000 - STANDARD SPECIFICATIONS AND CODE OF PRACTICE FOR ROAD BRIDGES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 3370 (Part 1)-2009 - Concrete Storage Structures',
            documentName: 'IS 3370 (Part 1)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
            pageCount: 120,
            pdfFilename: 'IS 3370 (Part 1)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 4995 (Part 1)-1974 - Reinforced Concrete Bins',
            documentName: 'IS 4995 (Part 1)-1974 - CRITERIA FOR DESIGN OF REINFORCED CONCRETE BINS FOR THE STORAGE OF GRANULAR AND POWDER',
            pageCount: 85,
            pdfFilename: 'IS 4995 (Part 1)-1974 - CRITERIA FOR DESIGN OF REINFORCED CONCRETE BINS FOR THE STORAGE OF GRANULAR AND POWDER.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Concrete Structures',
        icon: 'concrete',
        documents: [
          {
            displayName: 'IS 10262-2009 - Concrete Mix Proportioning',
            documentName: 'IS 10262-2009 - GUIDELINES FOR CONCRETE MIX PROPORTIONING',
            pageCount: 35,
            pdfFilename: 'IS 10262-2009 - GUIDELINES FOR CONCRETE MIX PROPORTIONING.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 1343-2012 - Prestressed Concrete',
            documentName: 'IS 1343-2012 - CODE OF PRACTICE FOR PRESTRESSED CONCRETE',
            pageCount: 180,
            pdfFilename: 'IS 1343-2012 - CODE OF PRACTICE FOR PRESTRESSED CONCRETE.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 3370 (Part 1)-2009 - Concrete Storage Structures',
            documentName: 'IS 3370 (Part 1)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
            pageCount: 120,
            pdfFilename: 'IS 3370 (Part 1)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 3370 (Part 2)-2009 - Concrete Storage Structures',
            documentName: 'IS 3370 (Part 2)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
            pageCount: 23,
            pdfFilename: 'IS 3370 (Part 2)-2009 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 3370 (Part 3)-1967 - Concrete Storage Structures',
            documentName: 'IS 3370 (Part 3)-1967 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
            pageCount: 18,
            pdfFilename: 'IS 3370 (Part 3)-1967 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 3370 (Part 4)-1967 - Concrete Storage Structures',
            documentName: 'IS 3370 (Part 4)-1967 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS',
            pageCount: 53,
            pdfFilename: 'IS 3370 (Part 4)-1967 - CODE OF PRACTICE FOR CONCRETE STRUCTURES FOR STORAGE OF LIQUIDS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 456-2000 - Plain and Reinforced Concrete',
            documentName: 'IS 456-2000 - CODE OF PRACTICE FOR PLAIN AND REINFORCED CONCRETE',
            pageCount: 115,
            pdfFilename: 'IS 456-2000 - CODE OF PRACTICE FOR PLAIN AND REINFORCED CONCRETE.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 1)-1987 - Design Loads',
            documentName: 'IS 875 (Part 1)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 25,
            pdfFilename: 'IS 875 (Part 1)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 2)-1987 - Design Loads',
            documentName: 'IS 875 (Part 2)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 48,
            pdfFilename: 'IS 875 (Part 2)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 3)-1987 - Design Loads',
            documentName: 'IS 875 (Part 3)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 50,
            pdfFilename: 'IS 875 (Part 3)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 4)-1987 - Design Loads',
            documentName: 'IS 875 (Part 4)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 28,
            pdfFilename: 'IS 875 (Part 4)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 5)-1987 - Design Loads',
            documentName: 'IS 875 (Part 5)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 42,
            pdfFilename: 'IS 875 (Part 5)-1987 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Earthquake & Wind',
        icon: 'earthquake',
        documents: [
          {
            displayName: 'IS 13920-1993 - Ductile Detailing',
            documentName: 'IS 13920-1993 - CODE OF PRACTICE FOR DUCTILE DETAILING OF REINFORCED CONCRETE STRUCTURES SUBJECTED TO SEISMIC FORCES',
            pageCount: 18,
            pdfFilename: 'IS 13920-1993 - CODE OF PRACTICE FOR DUCTILE DETAILING OF REINFORCED CONCRETE STRUCTURES SUBJECTED TO SEISMIC FORCES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 1893 (Part 1)-2016 - Earthquake Resistant Design',
            documentName: 'IS 1893 (Part 1)-2016 - CRITERIA FOR EARTHQUAKE RESISTANT DESIGN OF STRUCTURES',
            pageCount: 58,
            pdfFilename: 'IS 1893 (Part 1)-2016 - CRITERIA FOR EARTHQUAKE RESISTANT DESIGN OF STRUCTURES.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 4326-2013 - Earthquake Resistant Buildings',
            documentName: 'IS 4326-2013 - CODE OF PRACTICE FOR EARTHQUAKE RESISTANT DESIGN AND CONSTRUCTION OF BUILDINGS',
            pageCount: 94,
            pdfFilename: 'IS 4326-2013 - CODE OF PRACTICE FOR EARTHQUAKE RESISTANT DESIGN AND CONSTRUCTION OF BUILDINGS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 3)-2015 - Wind Loads',
            documentName: 'IS 875 (Part 3)-2015 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 82,
            pdfFilename: 'IS 875 (Part 3)-2015 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Foundation & Soils',
        icon: 'foundation',
        documents: [
          {
            displayName: 'IS 2911 (Part 1.1)-2010 - Pile Foundations',
            documentName: 'IS 2911 (Part 1.1)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
            pageCount: 42,
            pdfFilename: 'IS 2911 (Part 1.1)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 2911 (Part 1.2)-2010 - Pile Foundations',
            documentName: 'IS 2911 (Part 1.2)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
            pageCount: 38,
            pdfFilename: 'IS 2911 (Part 1.2)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 2911 (Part 1.3)-2010 - Pile Foundations',
            documentName: 'IS 2911 (Part 1.3)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
            pageCount: 22,
            pdfFilename: 'IS 2911 (Part 1.3)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 2911 (Part 1.4)-2010 - Pile Foundations',
            documentName: 'IS 2911 (Part 1.4)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS',
            pageCount: 28,
            pdfFilename: 'IS 2911 (Part 1.4)-2010 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF PILE FOUNDATIONS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 2950 (Part 1.1)-1981 - Raft Foundations',
            documentName: 'IS 2950 (Part 1.1)-1981 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF RAFT FOUNDATIONS',
            pageCount: 32,
            pdfFilename: 'IS 2950 (Part 1.1)-1981 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF RAFT FOUNDATIONS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 6403-1981 - Bearing Capacity',
            documentName: 'IS 6403-1981 - CODE OF PRACTICE FOR DETERMINATION OF BREAKING CAPACITY OF SHALLOW FOUNDATIONS',
            pageCount: 24,
            pdfFilename: 'IS 6403-1981 - CODE OF PRACTICE FOR DETERMINATION OF BREAKING CAPACITY OF SHALLOW FOUNDATIONS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 1904-1986 - Foundation Design in Soils',
            documentName: 'IS 1904-1986 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF FOUNDATIONS IN SOILS GENERAL REQUIREMENTS',
            pageCount: 52,
            pdfFilename: 'IS 1904-1986 - CODE OF PRACTICE FOR DESIGN AND CONSTRUCTION OF FOUNDATIONS IN SOILS GENERAL REQUIREMENTS.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Masonry & Timber',
        icon: 'masonry',
        documents: [
          {
            displayName: 'IS 1905-1987 - Unreinforced Masonry',
            documentName: 'IS 1905-1987 - CODE OF PRACTICE FOR STRUCTURAL USE OF UNREINFORCED MASONRY',
            pageCount: 62,
            pdfFilename: 'IS 1905-1987 - CODE OF PRACTICE FOR STRUCTURAL USE OF UNREINFORCED MASONRY.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 2212-1991 - Brick Works',
            documentName: 'IS 2212-1991 - CODE OF PRACTICE FOR BRICK WORKS',
            pageCount: 18,
            pdfFilename: 'IS 2212-1991 - CODE OF PRACTICE FOR BRICK WORKS.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 883-1994 - Structural Timber',
            documentName: 'IS 883-1994 - CODE OF PRACTICE FOR DESIGN OF STRUCTURAL TIMBER IN BUILDING',
            pageCount: 36,
            pdfFilename: 'IS 883-1994 - CODE OF PRACTICE FOR DESIGN OF STRUCTURAL TIMBER IN BUILDING.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS SP 20-1991 - Masonry Design Handbook',
            documentName: 'IS SP 20-1991 - HANDBOOK ON MASONRY DESIGN AND CONSTRUCTION',
            pageCount: 168,
            pdfFilename: 'IS SP 20-1991 - HANDBOOK ON MASONRY DESIGN AND CONSTRUCTION.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Steel Structures',
        icon: 'steel',
        documents: [
          {
            displayName: 'IS 4923-1997 - Hollow Steel Sections',
            documentName: 'IS 4923-1997 - SPECIFICATION FOR HOLLOW STEEL SECTIONS FOR STRUCTURAL USE',
            pageCount: 12,
            pdfFilename: 'IS 4923-1997 - SPECIFICATION FOR HOLLOW STEEL SECTIONS FOR STRUCTURAL USE.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 800-2007 - General Steel Construction',
            documentName: 'IS 800-2007 - CODE OF PRACTICE FOR GENERAL CONSTRUCTION IN STEEL',
            pageCount: 128,
            pdfFilename: 'IS 800-2007 - CODE OF PRACTICE FOR GENERAL CONSTRUCTION IN STEEL.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 801-1975 - Cold-Formed Steel Members',
            documentName: 'IS 801-1975 - CODE OF PRACTICE FOR USE OF COLD-FORMED LIGHT GAUGE STEEL STRUCTURAL MEMBERS IN GENERAL BUILDING CONSTRUCTION',
            pageCount: 52,
            pdfFilename: 'IS 801-1975 - CODE OF PRACTICE FOR USE OF COLD-FORMED LIGHT GAUGE STEEL STRUCTURAL MEMBERS IN GENERAL BUILDING CONSTRUCTION.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 806-1968 - Steel Tubes in Construction',
            documentName: 'IS 806-1968 - CODE OF PRACTICE FOR USE OF STEEL TUBES IN GENERAL BUILDING CONSTRUCTION',
            pageCount: 28,
            pdfFilename: 'IS 806-1968 - CODE OF PRACTICE FOR USE OF STEEL TUBES IN GENERAL BUILDING CONSTRUCTION.pdf',
            icon: 'document'
          },
          {
            displayName: 'IS 875 (Part 3)-2015 - Wind Loads',
            documentName: 'IS 875 (Part 3)-2015 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES',
            pageCount: 82,
            pdfFilename: 'IS 875 (Part 3)-2015 - CODE OF PRACTICE FOR DESIGN LOADS (OTHER THAN EARTHQUAKE) FOR BUILDINGS AND STRUCTURES.pdf',
            icon: 'document'
          }
        ]
      }
    ]
  },

  Scotland: {
    categories: [
      {
        name: 'Technical Handbooks',
        icon: 'handbook',
        documents: [
          {
            displayName: 'Technical Handbook - Domestic (2025)',
            documentName: 'Building standards technical handbook January 2025 domestic',
            pageCount: 650,
            pdfFilename: 'Building standards technical handbook January 2025 domestic.pdf',
            icon: 'document'
          },
          {
            displayName: 'Technical Handbook - Non-Domestic (2025)',
            documentName: 'Building standards technical handbook January 2025 non-domestic',
            pageCount: 720,
            pdfFilename: 'Building standards technical handbook January 2025 non-domestic.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Cladding Guidance',
        icon: 'cladding',
        documents: [
          {
            displayName: 'Fire Risk Assessment - External Walls',
            documentName: 'determining-fire-risk-posed-external-wall-systems-existing-multistorey-residential-buildings',
            pageCount: 54,
            pdfFilename: 'determining-fire-risk-posed-external-wall-systems-existing-multistorey-residential-buildings.pdf',
            icon: 'document'
          },
          {
            displayName: 'Scottish Advice Note - External Walls (v3.0)',
            documentName: 'draft-scottish-advice-note-external-wall-systems-version-3-0',
            pageCount: 62,
            pdfFilename: 'draft-scottish-advice-note-external-wall-systems-version-3-0.pdf',
            icon: 'document'
          }
        ]
      },
      {
        name: 'Single Building Assessment',
        icon: 'assessment',
        documents: [
          {
            displayName: 'SBA Specification (2025)',
            documentName: 'single-building-assessment-specification-sba',
            pageCount: 45,
            pdfFilename: 'single-building-assessment-specification-sba.pdf',
            icon: 'document'
          },
          {
            displayName: 'SBA Additional Work Standards',
            documentName: 'standards-single-building-assessments-additional-work-assessments',
            pageCount: 38,
            pdfFilename: 'standards-single-building-assessments-additional-work-assessments.pdf',
            icon: 'document'
          },
          {
            displayName: 'Task Group Recommendations (March 2024)',
            documentName: 'task-group-recommendations-march-2024',
            pageCount: 85,
            pdfFilename: 'task-group-recommendations-march-2024.pdf',
            icon: 'document'
          }
        ]
      }
    ]
  },

  Dubai: {
    categories: [
      {
        name: 'Building Code',
        icon: 'building',
        documents: [
          {
            displayName: 'Dubai Building Code (2021 Edition)',
            documentName: 'Dubai Building Code English 2021 Edition',
            pageCount: 980,
            pdfFilename: 'Dubai Building Code_English_2021 Edition.pdf',
            icon: 'document'
          }
        ]
      }
    ]
  }
};

/**
 * Helper function to get all documents for a region (flattened)
 */
export function getAllDocumentsForRegion(region) {
  const regionData = DOCUMENT_CATEGORIES[region];
  if (!regionData) return [];
  
  return regionData.categories.flatMap(category => 
    category.documents.map(doc => ({
      ...doc,
      category: category.name
    }))
  );
}

/**
 * Helper function to get document by name
 */
export function getDocumentByName(region, documentName) {
  const allDocs = getAllDocumentsForRegion(region);
  return allDocs.find(doc => doc.documentName === documentName);
}

/**
 * Helper function to search documents
 */
export function searchDocuments(region, searchQuery) {
  const allDocs = getAllDocumentsForRegion(region);
  const query = searchQuery.toLowerCase();
  
  return allDocs.filter(doc => 
    doc.displayName.toLowerCase().includes(query) ||
    doc.documentName.toLowerCase().includes(query)
  );
}

/**
 * Get PDF filename for backend API calls
 */
export function getPdfFilename(region, documentName) {
  const doc = getDocumentByName(region, documentName);
  return doc ? doc.pdfFilename : null;
}

/**
 * Get display name from document name
 */
export function getDisplayName(region, documentName) {
  const doc = getDocumentByName(region, documentName);
  return doc ? doc.displayName : documentName;
}