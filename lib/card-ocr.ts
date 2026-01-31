import { createWorker } from 'tesseract.js'

export interface ExtractedCardData {
  name?: string
  brand?: string
  card_number?: string
  barcode?: string
  points_balance?: string
  notes?: string
}

// Known loyalty card brands to look for
const KNOWN_BRANDS = [
  'tesco', 'sainsbury', 'sainsburys', 'lidl', 'aldi', 'coop', 'co-op',
  'waitrose', 'asda', 'morrisons', 'ikea', 'starbucks', 'costa',
  'pret', 'boots', 'superdrug', 'nectar', 'clubcard', 'advantage',
  'sparks', 'mymorrison', 'myasda', 'h&m', 'zara', 'primark'
]

/**
 * Initialize Tesseract worker for OCR processing
 */
let worker: Awaited<ReturnType<typeof createWorker>> | null = null

export const initializeOCRWorker = async (): Promise<void> => {
  if (worker) return

  try {
    worker = await createWorker('eng')
    console.log('OCR worker initialized')
  } catch (error) {
    console.error('Failed to initialize OCR worker:', error)
    throw new Error('Failed to initialize OCR')
  }
}

/**
 * Terminate the OCR worker to free resources
 */
export const terminateOCRWorker = async (): Promise<void> => {
  if (worker) {
    await worker.terminate()
    worker = null
    console.log('OCR worker terminated')
  }
}

/**
 * Extract text from an image using Tesseract.js
 */
const extractTextFromImage = async (imageData: string): Promise<string> => {
  if (!worker) {
    await initializeOCRWorker()
  }

  if (!worker) {
    throw new Error('OCR worker not initialized')
  }

  try {
    const { data } = await worker.recognize(imageData)
    return data.text
  } catch (error) {
    console.error('OCR extraction error:', error)
    throw new Error('Failed to extract text from image')
  }
}

/**
 * Extract brand name from text
 */
const extractBrand = (text: string): string | undefined => {
  const lowerText = text.toLowerCase()
  
  for (const brand of KNOWN_BRANDS) {
    if (lowerText.includes(brand)) {
      // Capitalize first letter of each word
      return brand
        .split(/[\s-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }
  
  return undefined
}

/**
 * Extract card/member numbers from text
 * Looks for sequences of digits that could be card numbers
 */
const extractCardNumber = (text: string): string | undefined => {
  // Look for sequences of 8-20 digits, possibly with spaces or dashes
  const patterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // 16 digits in groups of 4
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,            // 12 digits in groups of 4
    /\b\d{8,20}\b/g,                                // 8-20 consecutive digits
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      // Return the first match, cleaned up
      return matches[0].replace(/[\s-]/g, '')
    }
  }

  return undefined
}

/**
 * Extract barcode number from text
 * Usually appears below the barcode graphic as a sequence of digits
 */
const extractBarcode = (text: string): string | undefined => {
  // Look for EAN-13 (13 digits), EAN-8 (8 digits), or other barcode formats
  const barcodePatterns = [
    /\b\d{13}\b/g,  // EAN-13
    /\b\d{12}\b/g,  // UPC-A
    /\b\d{8}\b/g,   // EAN-8
  ]

  for (const pattern of barcodePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      return matches[0]
    }
  }

  return undefined
}

/**
 * Extract points balance from text
 * Looks for numbers followed by "points", "pts", "punti", etc.
 */
const extractPointsBalance = (text: string): string | undefined => {
  const patterns = [
    /(\d+(?:[,.\s]\d+)*)\s*(?:points?|pts?|punti)/i,
    /(?:balance|saldo|points):\s*(\d+(?:[,.\s]\d+)*)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      // Clean up the number (remove commas, spaces)
      return match[1].replace(/[,\s]/g, '')
    }
  }

  return undefined
}

/**
 * Generate a card name based on the brand
 */
const generateCardName = (brand?: string): string => {
  if (!brand) return 'Loyalty Card'
  
  const brandLower = brand.toLowerCase()
  
  // Known brand mappings to card names
  const brandToCardName: Record<string, string> = {
    'tesco': 'Tesco Clubcard',
    'sainsbury': 'Sainsbury\'s Nectar Card',
    'sainsburys': 'Sainsbury\'s Nectar Card',
    'nectar': 'Nectar Card',
    'clubcard': 'Tesco Clubcard',
    'lidl': 'Lidl Plus',
    'aldi': 'Aldi Card',
    'coop': 'Co-op Membership',
    'co-op': 'Co-op Membership',
    'waitrose': 'Waitrose MyWaitrose',
    'asda': 'Asda Rewards',
    'morrisons': 'Morrisons More Card',
    'ikea': 'IKEA Family',
    'starbucks': 'Starbucks Rewards',
    'costa': 'Costa Coffee Club',
    'boots': 'Boots Advantage Card',
    'advantage': 'Boots Advantage Card',
  }
  
  for (const [key, name] of Object.entries(brandToCardName)) {
    if (brandLower.includes(key)) {
      return name
    }
  }
  
  return `${brand} Card`
}

/**
 * Process a loyalty card image and extract information
 * @param imageData Base64 data URL or URL of the image
 * @returns Extracted card data
 */
export const processCardImage = async (imageData: string): Promise<ExtractedCardData> => {
  try {
    // Extract text from image
    const text = await extractTextFromImage(imageData)
    console.log('Extracted text:', text)

    // Parse the text for card information
    const brand = extractBrand(text)
    const card_number = extractCardNumber(text)
    const barcode = extractBarcode(text)
    const points_balance = extractPointsBalance(text)
    
    // Generate card name from brand
    const name = generateCardName(brand)

    // Create notes with raw extracted text for reference
    const notes = text.trim().length > 0 
      ? `Extracted text: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`
      : undefined

    return {
      name,
      brand,
      card_number,
      barcode,
      points_balance,
      notes,
    }
  } catch (error) {
    console.error('Card processing error:', error)
    throw new Error('Failed to process card image')
  }
}

/**
 * Validate if a file is an image
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}

/**
 * Convert a File to a data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
