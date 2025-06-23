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
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {displayNumber && (
            <div className="text-center max-w-full">
              <div className="overflow-hidden flex justify-center">
                <Barcode
                  value={displayNumber.replace(/\s/g, '')}
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
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-end">
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