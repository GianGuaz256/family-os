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
  const displayNumber = cardNumber || barcode || '0000000000'
  const displayBrand = brand || 'LOYALTY CARD'
  
  const cardStyles = {
    small: {
      container: 'w-full h-32',
      text: 'text-xs',
      brandText: 'text-sm font-bold',
      numberText: 'text-xs font-mono',
      barcodeHeight: 20
    },
    large: {
      container: 'w-full h-80',
      text: 'text-lg',
      brandText: 'text-3xl font-bold',
      numberText: 'text-xl font-mono',
      barcodeHeight: 60
    }
  }

  const styles = cardStyles[size]

  return (
    <div 
      className={`${styles.container} bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105`}
      onClick={onClick}
    >
      <div className="h-full flex flex-col justify-between p-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className={`${styles.brandText} text-gray-800 uppercase tracking-wide`}>
              {displayBrand}
            </div>
            <div className={`${styles.text} text-gray-600 mt-1`}>
              {name}
            </div>
          </div>
          {pointsBalance && (
            <div className="text-right">
              <div className={`${styles.text} text-gray-600`}>Points</div>
              <div className={`${styles.text} font-bold text-green-600`}>
                {pointsBalance}
              </div>
            </div>
          )}
        </div>

        {/* Middle - Barcode */}
        <div className="flex-1 flex items-center justify-center">
          {displayNumber && (
            <div className="text-center">
              <Barcode
                value={displayNumber}
                height={styles.barcodeHeight}
                width={size === 'large' ? 2 : 1}
                fontSize={size === 'large' ? 14 : 10}
                background="transparent"
                lineColor="#000000"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className={`${styles.numberText} text-gray-700`}>
            {displayNumber}
          </div>
          {expiryDate && (
            <div className={`${styles.text} text-gray-500`}>
              Exp: {expiryDate}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 