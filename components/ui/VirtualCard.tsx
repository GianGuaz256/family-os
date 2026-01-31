import React from 'react'
import Barcode from 'react-barcode'

interface VirtualCardProps {
  name: string
  brand?: string | null
  cardNumber?: string | null
  barcode?: string | null
  pointsBalance?: string | null
  expiryDate?: string | null
  size?: 'small' | 'large'
  onClick?: () => void
}

// Brand color themes for known loyalty cards
const brandThemes: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  tesco: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', accent: 'text-blue-600' },
  sainsbury: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-900', accent: 'text-orange-600' },
  sainsburys: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-900', accent: 'text-orange-600' },
  nectar: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-900', accent: 'text-purple-600' },
  lidl: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-900', accent: 'text-yellow-600' },
  aldi: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', accent: 'text-blue-600' },
  coop: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', accent: 'text-blue-600' },
  waitrose: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-900', accent: 'text-green-600' },
  asda: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-900', accent: 'text-green-600' },
  morrisons: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-900', accent: 'text-yellow-600' },
  ikea: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', accent: 'text-blue-600' },
  starbucks: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-900', accent: 'text-green-600' },
  costa: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900', accent: 'text-red-600' },
  boots: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', accent: 'text-blue-600' },
}

const defaultTheme = { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800', accent: 'text-gray-600' }

/**
 * Get brand theme based on brand name
 */
const getBrandTheme = (brand?: string | null) => {
  if (!brand) return defaultTheme
  
  const brandKey = brand.toLowerCase().replace(/[^a-z]/g, '')
  return brandThemes[brandKey] || defaultTheme
}

/**
 * Validate if barcode can be displayed
 */
const isValidBarcode = (value?: string | null): boolean => {
  if (!value) return false
  const cleaned = value.replace(/[\s-]/g, '')
  return /^\d{8,20}$/.test(cleaned)
}

export const VirtualCard: React.FC<VirtualCardProps> = ({
  name,
  brand,
  cardNumber,
  barcode,
  pointsBalance,
  expiryDate,
  size = 'small',
  onClick
}) => {
  const displayBrand = brand || 'LOYALTY CARD'
  const theme = getBrandTheme(brand)
  const hasValidBarcode = isValidBarcode(barcode)
  const displayNumber = hasValidBarcode ? barcode : cardNumber
  
  const cardStyles = {
    small: {
      container: 'w-full max-w-full h-32',
      text: 'text-xs',
      brandText: 'text-sm font-bold',
      numberText: 'text-xs font-mono',
      barcodeHeight: 20
    },
    large: {
      container: 'w-full max-w-full h-80 max-h-[60vh]',
      text: 'text-base sm:text-lg',
      brandText: 'text-xl sm:text-2xl md:text-3xl font-bold',
      numberText: 'text-sm sm:text-lg md:text-xl font-mono',
      barcodeHeight: 60
    }
  }

  const styles = cardStyles[size]

  return (
    <div 
      className={`${styles.container} ${theme.bg} border-2 ${theme.border} rounded-xl shadow-lg overflow-hidden ${onClick ? 'cursor-pointer' : ''} transition-all duration-200 hover:shadow-xl ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="h-full flex flex-col justify-between p-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className={`${styles.brandText} ${theme.text} uppercase tracking-wide`}>
              {displayBrand}
            </div>
            <div className={`${styles.text} ${theme.accent} mt-1`}>
              {name}
            </div>
          </div>
          {pointsBalance && (
            <div className="text-right">
              <div className={`${styles.text} ${theme.accent}`}>Points</div>
              <div className={`${styles.text} font-bold text-green-600 dark:text-green-500`}>
                {pointsBalance}
              </div>
            </div>
          )}
        </div>

        {/* Middle - Barcode or Card Number */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {hasValidBarcode && displayNumber ? (
            <div className="text-center max-w-full">
              <div className="overflow-hidden flex justify-center">
                <Barcode
                  value={displayNumber.replace(/[\s-]/g, '')}
                  height={styles.barcodeHeight}
                  width={size === 'large' ? 1.5 : 1}
                  fontSize={size === 'large' ? 12 : 8}
                  background="transparent"
                  lineColor="#000000"
                  displayValue={true}
                  textAlign="center"
                  textPosition="bottom"
                  textMargin={2}
                  marginLeft={10}
                  marginRight={10}
                />
              </div>
            </div>
          ) : cardNumber ? (
            <div className="text-center">
              <div className={`text-xs ${theme.accent} mb-1`}>Member ID</div>
              <div className={`${styles.numberText} ${theme.text} font-mono`}>
                {cardNumber}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className={`${styles.text} ${theme.accent} italic`}>
                No barcode or member number
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          {cardNumber && hasValidBarcode && (
            <div className={`${styles.text} ${theme.accent} font-mono`}>
              ID: {cardNumber.substring(0, size === 'large' ? 16 : 8)}
            </div>
          )}
          {expiryDate && (
            <div className={`${styles.text} ${theme.accent} ml-auto`}>
              Exp: {expiryDate}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 