/**
 * Coverage Type ENUM
 * Unified coverage types used across the backend and synced to frontend via OpenAPI
 *
 * NOTE: Frontend should use these values (with underscores) instead of hyphenated IDs
 * The OpenAPI generator will export these to the frontend types
 */
export enum CoverageType {
  // Core Commercial Lines
  GENERAL_LIABILITY = 'general_liability',
  PROFESSIONAL_LIABILITY = 'professional_liability',
  WORKERS_COMPENSATION = 'workers_compensation',
  COMMERCIAL_AUTO = 'commercial_auto',
  COMMERCIAL_PROPERTY = 'commercial_property',
  BUSINESS_OWNERS_POLICY = 'business_owners_policy',

  // Specialty Lines
  CYBER_LIABILITY = 'cyber_liability',
  EMPLOYMENT_PRACTICES_LIABILITY = 'employment_practices_liability',
  DIRECTORS_OFFICERS = 'directors_officers',

  // Additional Lines
  UMBRELLA_EXCESS_LIABILITY = 'umbrella_excess_liability',
  EMPLOYEE_BENEFITS = 'employee_benefits',
  CRIME_LIABILITY = 'crime_liability',
  MEDIA_LIABILITY = 'media_liability',
  FIDUCIARY_LIABILITY = 'fiduciary_liability',
  TOOLS_EQUIPMENT = 'tools_equipment',
}

/**
 * Coverage Type Display Labels
 * Maps enum values to human-readable display labels
 */
export const CoverageTypeLabels: Record<CoverageType, string> = {
  [CoverageType.GENERAL_LIABILITY]: 'General Liability',
  [CoverageType.PROFESSIONAL_LIABILITY]: 'Professional Liability (E&O)',
  [CoverageType.WORKERS_COMPENSATION]: "Workers' Compensation",
  [CoverageType.COMMERCIAL_AUTO]: 'Commercial Auto',
  [CoverageType.COMMERCIAL_PROPERTY]: 'Commercial Property',
  [CoverageType.BUSINESS_OWNERS_POLICY]: "Business Owner's Policy (BOP)",
  [CoverageType.CYBER_LIABILITY]: 'Cyber Liability',
  [CoverageType.EMPLOYMENT_PRACTICES_LIABILITY]:
    'Employment Practices Liability',
  [CoverageType.DIRECTORS_OFFICERS]: 'Directors & Officers Liability',
  [CoverageType.UMBRELLA_EXCESS_LIABILITY]: 'Umbrella / Excess Liability',
  [CoverageType.EMPLOYEE_BENEFITS]: 'Employee Benefits',
  [CoverageType.CRIME_LIABILITY]: 'Crime Liability',
  [CoverageType.MEDIA_LIABILITY]: 'Media Liability',
  [CoverageType.FIDUCIARY_LIABILITY]: 'Fiduciary Liability',
  [CoverageType.TOOLS_EQUIPMENT]: 'Tools & Equipment',
};

/**
 * Coverage Type Short Codes
 * Maps enum values to short codes for display
 */
export const CoverageTypeCodes: Record<CoverageType, string> = {
  [CoverageType.GENERAL_LIABILITY]: 'GL',
  [CoverageType.PROFESSIONAL_LIABILITY]: 'E&O',
  [CoverageType.WORKERS_COMPENSATION]: 'WC',
  [CoverageType.COMMERCIAL_AUTO]: 'CA',
  [CoverageType.COMMERCIAL_PROPERTY]: 'CP',
  [CoverageType.BUSINESS_OWNERS_POLICY]: 'BOP',
  [CoverageType.CYBER_LIABILITY]: 'CY',
  [CoverageType.EMPLOYMENT_PRACTICES_LIABILITY]: 'EPL',
  [CoverageType.DIRECTORS_OFFICERS]: 'D&O',
  [CoverageType.UMBRELLA_EXCESS_LIABILITY]: 'XS',
  [CoverageType.EMPLOYEE_BENEFITS]: 'EB',
  [CoverageType.CRIME_LIABILITY]: 'CR',
  [CoverageType.MEDIA_LIABILITY]: 'ML',
  [CoverageType.FIDUCIARY_LIABILITY]: 'FL',
  [CoverageType.TOOLS_EQUIPMENT]: 'TE',
};

/**
 * Get all coverage type values as an array
 */
export const getAllCoverageTypes = (): CoverageType[] => {
  return Object.values(CoverageType);
};

/**
 * Check if a string is a valid coverage type
 */
export const isValidCoverageType = (value: string): value is CoverageType => {
  return Object.values(CoverageType).includes(value as CoverageType);
};

/**
 * Normalize coverage type from various formats (hyphenated, spaces) to enum value
 * @param input - The coverage type string in any format
 * @returns The normalized CoverageType enum value or null if not found
 */
export const normalizeCoverageType = (input: string): CoverageType | null => {
  // Already in correct format
  if (isValidCoverageType(input)) {
    return input;
  }

  // Try converting from hyphenated format (frontend format) to underscored (backend format)
  const underscored = input.replace(/-/g, '_').toLowerCase();
  if (isValidCoverageType(underscored)) {
    return underscored;
  }

  // Handle common variations
  const mappings: Record<string, CoverageType> = {
    // Hyphenated variants
    'errors-omissions-professional-liability':
      CoverageType.PROFESSIONAL_LIABILITY,
    'workers-compensation-liability': CoverageType.WORKERS_COMPENSATION,
    'commercial-property-liability': CoverageType.COMMERCIAL_PROPERTY,
    'auto-liability': CoverageType.COMMERCIAL_AUTO,
    'directors-officers-liability': CoverageType.DIRECTORS_OFFICERS,
    'employment-practices-liability':
      CoverageType.EMPLOYMENT_PRACTICES_LIABILITY,
    bop: CoverageType.BUSINESS_OWNERS_POLICY,
    'workers-comp': CoverageType.WORKERS_COMPENSATION,

    // Underscore variants for mapping
    errors_omissions_professional_liability:
      CoverageType.PROFESSIONAL_LIABILITY,
    workers_compensation_liability: CoverageType.WORKERS_COMPENSATION,
    commercial_property_liability: CoverageType.COMMERCIAL_PROPERTY,
    auto_liability: CoverageType.COMMERCIAL_AUTO,
    directors_officers_liability: CoverageType.DIRECTORS_OFFICERS,
    workers_comp: CoverageType.WORKERS_COMPENSATION,
  };

  const normalized = input.toLowerCase().replace(/-/g, '_');
  return mappings[normalized] || mappings[input.toLowerCase()] || null;
};
