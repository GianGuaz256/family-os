import { z } from 'zod'

/**
 * Validation helper: Check if barcode format is valid
 * Barcodes should be numeric and between 8-20 digits
 */
const isValidBarcodeFormat = (value: string | null | undefined): boolean => {
  if (!value) return true // Optional field
  
  // Remove spaces and dashes
  const cleaned = value.replace(/[\s-]/g, '')
  
  // Check if it's numeric and within valid length
  return /^\d{8,20}$/.test(cleaned)
}

/**
 * Validation helper: Check if value is numeric or empty
 */
const isNumericOrEmpty = (value: string | null | undefined): boolean => {
  if (!value) return true // Optional field
  
  // Remove commas and spaces
  const cleaned = value.replace(/[,\s]/g, '')
  
  // Check if it's numeric
  return /^\d+$/.test(cleaned)
}

/**
 * Validation helper: Check if date format is valid
 * Accepts YYYY-MM-DD, MM/YY, or MM/YYYY formats
 */
const isValidDateFormat = (value: string | null | undefined): boolean => {
  if (!value) return true // Optional field
  
  // Accept various date formats
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}$/,      // MM/YY
    /^\d{2}\/\d{4}$/,      // MM/YYYY
  ]
  
  return datePatterns.some(pattern => pattern.test(value))
}

/**
 * Zod schema for loyalty card creation/update
 */
export const loyaltyCardSchema = z.object({
  name: z.string()
    .min(1, 'Card name is required')
    .max(100, 'Card name must be less than 100 characters')
    .trim(),
  
  brand: z.string()
    .max(50, 'Brand name must be less than 50 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || null),
  
  card_number: z.string()
    .max(50, 'Card number must be less than 50 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || null),
  
  barcode: z.string()
    .max(50, 'Barcode must be less than 50 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || null)
    .refine(isValidBarcodeFormat, {
      message: 'Invalid barcode format. Must be 8-20 digits.',
    }),
  
  points_balance: z.string()
    .max(20, 'Points balance must be less than 20 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || null)
    .refine(isNumericOrEmpty, {
      message: 'Points balance must be a number',
    }),
  
  expiry_date: z.string()
    .trim()
    .optional()
    .nullable()
    .transform(val => val || null)
    .refine(isValidDateFormat, {
      message: 'Invalid date format. Use YYYY-MM-DD, MM/YY, or MM/YYYY',
    }),
  
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
    .transform(val => val || null),
})

/**
 * Type for validated loyalty card data
 */
export type LoyaltyCardInput = z.infer<typeof loyaltyCardSchema>

/**
 * Validate loyalty card data
 * @param data Raw card data to validate
 * @returns Validation result with data or errors
 */
export const validateLoyaltyCard = (
  data: unknown
): { success: true; data: LoyaltyCardInput } | { success: false; errors: Record<string, string[]> } => {
  try {
    const validatedData = loyaltyCardSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      
      return { success: false, errors }
    }
    
    return {
      success: false,
      errors: { general: ['Validation failed'] },
    }
  }
}

/**
 * Helper function to format validation errors for display
 */
export const formatValidationErrors = (errors: Record<string, string[]>): string => {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ')
}

/**
 * Quick validation check for individual fields
 */
export const fieldValidators = {
  barcode: (value: string): string | null => {
    if (!value) return null
    return isValidBarcodeFormat(value) ? null : 'Invalid barcode format (8-20 digits required)'
  },
  
  points_balance: (value: string): string | null => {
    if (!value) return null
    return isNumericOrEmpty(value) ? null : 'Points must be a number'
  },
  
  expiry_date: (value: string): string | null => {
    if (!value) return null
    return isValidDateFormat(value) ? null : 'Invalid date format'
  },
}
