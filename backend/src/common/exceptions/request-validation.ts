import { ValidationError } from '@nestjs/common';

/**
 * Extracts validation errors from NestJS ValidationError objects into a flattened format
 */
export const extractValidationErrors = (
  validationErrors: ValidationError[],
  parentPath = '',
): { property: string; errors: string[] }[] => {
  const result: { property: string; errors: string[] }[] = [];

  for (const error of validationErrors) {
    const propertyPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    // Add current level constraints if they exist
    if (error.constraints) {
      result.push({
        property: propertyPath,
        errors: Object.values(error.constraints),
      });
    }

    // Process nested validation errors recursively
    if (error.children?.length) {
      const nestedErrors = extractValidationErrors(
        error.children,
        propertyPath,
      );

      result.push(...nestedErrors);
    }
  }

  return result;
};
