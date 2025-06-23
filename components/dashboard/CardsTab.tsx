import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { VirtualCard } from '../ui/VirtualCard'
import { Camera, CreditCard, Plus, Trash2, Edit, X, Brain, Maximize2 } from 'lucide-react'

interface LoyaltyCard {
  id: string
  name: string
  brand: string | null
  card_number: string | null
  barcode: string | null
  points_balance: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
}

interface CardsTabProps {
  cards: LoyaltyCard[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
}

export const CardsTab: React.FC<CardsTabProps> = ({
  cards,
  groupId,
  onUpdate,
  isOnline
}) => {
  const [showScanModal, setShowScanModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFullscreenCard, setShowFullscreenCard] = useState<LoyaltyCard | null>(null)
  const [editingCard, setEditingCard] = useState<LoyaltyCard | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractionResults, setExtractionResults] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    card_number: '',
    barcode: '',
    points_balance: '',
    expiry_date: '',
    notes: ''
  })

  const webcamRef = useRef<Webcam>(null)

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      card_number: '',
      barcode: '',
      points_balance: '',
      expiry_date: '',
      notes: ''
    })
    setCapturedImage(null)
    setExtractionResults(null)
    setEditingCard(null)
    setShowFullscreenCard(null)
  }

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setIsScanning(false)
      processImageWithAI(imageSrc)
    }
  }, [webcamRef])

  const processImageWithAI = async (imageData: string) => {
    setIsProcessing(true)
    setExtractionResults(null)
    
    try {
      // Check if we have API route available
      const response = await fetch('/api/analyze-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        if (errorText.includes('<!DOCTYPE')) {
          // API route doesn't exist or server error
          throw new Error('AI analysis service is not available. Please add OpenAI API key to environment variables.')
        } else {
          throw new Error(`API Error (${response.status}): ${errorText}`)
        }
      }

      const result = await response.json()
      
      if (result.cardInfo && Object.keys(result.cardInfo).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...result.cardInfo
        }))
        setExtractionResults(`Successfully extracted: ${Object.keys(result.cardInfo).join(', ')}`)
      } else {
        setExtractionResults('No card information could be extracted from this image. Please fill in the details manually.')
      }

    } catch (error) {
      console.error('AI processing error:', error)
      setExtractionResults(`${error instanceof Error ? error.message : 'Failed to analyze image'}. You can still fill in the card details manually.`)
      
      // Set a basic fallback name so users can still save the card
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: 'Loyalty Card'
        }))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const saveCard = async () => {
    if (!formData.name.trim() || !isOnline) return

    try {
      const cardData = {
        group_id: groupId,
        name: formData.name,
        brand: formData.brand || null,
        card_number: formData.card_number || null,
        barcode: formData.barcode || null,
        points_balance: formData.points_balance || null,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes || null
      }

      if (editingCard) {
        const { error } = await supabase
          .from('cards')
          .update(cardData)
          .eq('id', editingCard.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cards')
          .insert([cardData])
        if (error) throw error
      }

      resetForm()
      setShowScanModal(false)
      setShowAddModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error saving card:', error)
    }
  }

  const deleteCard = async (cardId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this card?')) return

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const editCard = (card: LoyaltyCard) => {
    setEditingCard(card)
    setFormData({
      name: card.name,
      brand: card.brand || '',
      card_number: card.card_number || '',
      barcode: card.barcode || '',
      points_balance: card.points_balance || '',
      expiry_date: card.expiry_date || '',
      notes: card.notes || ''
    })
    setShowAddModal(true)
  }

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Loyalty Cards</h2>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No cards yet
          </h3>
          <p className="text-gray-600 mb-4">
            Scan or add your first loyalty card to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold truncate">{card.name}</h3>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullscreenCard(card)}
                    disabled={!isOnline}
                    className="px-2"
                    title="View fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editCard(card)}
                    disabled={!isOnline}
                    className="px-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCard(card.id)}
                    disabled={!isOnline}
                    className="text-red-600 hover:text-red-700 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <VirtualCard
                  name={card.name}
                  brand={card.brand}
                  cardNumber={card.card_number}
                  barcode={card.barcode}
                  pointsBalance={card.points_balance}
                  expiryDate={card.expiry_date}
                  size="small"
                  onClick={() => setShowFullscreenCard(card)}
                />
                {card.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <strong>Notes:</strong> {card.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scan Modal */}
      <Dialog
        open={showScanModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowScanModal(false)
            setIsScanning(false)
            setCapturedImage(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scan Loyalty Card</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          {!capturedImage ? (
            <div className="space-y-4">
              {isScanning ? (
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                    videoConstraints={{
                      facingMode: "environment"
                    }}
                  />
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button onClick={captureImage}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setIsScanning(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">📷</div>
                  <h3 className="font-semibold mb-2">AI Card Scanner</h3>
                  <p className="text-gray-600 mb-4">
                    Uses AI to detect and extract information from:
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Brain className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <div className="font-medium">Barcodes</div>
                      <div className="text-xs text-gray-600">Member numbers</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CreditCard className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <div className="font-medium">Card Info</div>
                      <div className="text-xs text-gray-600">Brand, points, expiry</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Position your card clearly with good lighting for best results
                  </p>
                  <Button onClick={() => setIsScanning(true)}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanner
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <img 
                  src={capturedImage} 
                  alt="Captured card" 
                  className="w-full max-w-sm mx-auto rounded-lg border-2 border-gray-200"
                />
                
                {isProcessing ? (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-blue-800">AI analyzing your card...</p>
                    <p className="text-xs text-blue-600 mt-1">Extracting barcodes, text, and information</p>
                  </div>
                ) : extractionResults && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    extractionResults.startsWith('Error') 
                      ? 'bg-red-50 border border-red-200' 
                      : extractionResults.includes('No card information')
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <h4 className={`font-semibold mb-1 ${
                      extractionResults.startsWith('Error') 
                        ? 'text-red-800' 
                        : extractionResults.includes('No card information')
                        ? 'text-yellow-800'
                        : 'text-green-800'
                    }`}>
                      Analysis Results:
                    </h4>
                    <p className={`text-sm ${
                      extractionResults.startsWith('Error') 
                        ? 'text-red-700' 
                        : extractionResults.includes('No card information')
                        ? 'text-yellow-700'
                        : 'text-green-700'
                    }`}>
                      {extractionResults}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="card-name">Card Name *</Label>
                  <Input
                    id="card-name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g., Tesco Clubcard, Starbucks Card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleFormChange('brand', e.target.value)}
                    placeholder="e.g., Tesco, Starbucks"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    value={formData.card_number}
                    onChange={(e) => handleFormChange('card_number', e.target.value)}
                    placeholder="Member/card number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleFormChange('barcode', e.target.value)}
                    placeholder="Barcode number (if different from card number)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Points Balance</Label>
                  <Input
                    id="points"
                    value={formData.points_balance}
                    onChange={(e) => handleFormChange('points_balance', e.target.value)}
                    placeholder="Current points/balance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    value={formData.expiry_date}
                    onChange={(e) => handleFormChange('expiry_date', e.target.value)}
                    placeholder="MM/YY or MM/YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Additional notes or benefits"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveCard} 
                  className="flex-1" 
                  disabled={!formData.name.trim() || isProcessing}
                >
                  Save Card
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCapturedImage(null)
                    resetForm()
                  }}
                  disabled={isProcessing}
                >
                  Retake
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowScanModal(false)
                    setCapturedImage(null)
                    resetForm()
                  }}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Manual Modal */}
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? "Edit Card" : "Add Card Manually"}</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-card-name">Card Name *</Label>
            <Input
              id="edit-card-name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="e.g., Tesco Clubcard, Starbucks Card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-brand">Brand</Label>
            <Input
              id="edit-brand"
              value={formData.brand}
              onChange={(e) => handleFormChange('brand', e.target.value)}
              placeholder="e.g., Tesco, Starbucks"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-card-number">Card Number</Label>
            <Input
              id="edit-card-number"
              value={formData.card_number}
              onChange={(e) => handleFormChange('card_number', e.target.value)}
              placeholder="Member/card number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-barcode">Barcode</Label>
            <Input
              id="edit-barcode"
              value={formData.barcode}
              onChange={(e) => handleFormChange('barcode', e.target.value)}
              placeholder="Barcode number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-points">Points Balance</Label>
            <Input
              id="edit-points"
              value={formData.points_balance}
              onChange={(e) => handleFormChange('points_balance', e.target.value)}
              placeholder="Current points/balance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-expiry">Expiry Date</Label>
            <Input
              id="edit-expiry"
              value={formData.expiry_date}
              onChange={(e) => handleFormChange('expiry_date', e.target.value)}
              placeholder="MM/YY or MM/YYYY"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Input
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Additional notes or benefits"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={saveCard} className="flex-1" disabled={!formData.name.trim()}>
              {editingCard ? "Update Card" : "Add Card"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Card Modal */}
      <Dialog
        open={!!showFullscreenCard}
        onOpenChange={(open) => {
          if (!open) setShowFullscreenCard(null)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{showFullscreenCard?.name || ''}</DialogTitle>
          </DialogHeader>
        {showFullscreenCard && (
          <div className="space-y-4">
            <VirtualCard
              name={showFullscreenCard.name}
              brand={showFullscreenCard.brand}
              cardNumber={showFullscreenCard.card_number}
              barcode={showFullscreenCard.barcode}
              pointsBalance={showFullscreenCard.points_balance}
              expiryDate={showFullscreenCard.expiry_date}
              size="large"
            />
            <div className="text-center text-sm text-gray-600">
              <p>Show this card at checkout to earn points</p>
              {showFullscreenCard.notes && (
                <p className="mt-2 p-3 bg-blue-50 rounded-lg text-blue-800">
                  <strong>Notes:</strong> {showFullscreenCard.notes}
                </p>
              )}
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button 
          onClick={() => setShowScanModal(true)}
          disabled={!isOnline}
          size="lg"
          variant="secondary"
          className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Camera className="h-5 w-5" />
        </Button>
        <Button 
          onClick={() => setShowAddModal(true)}
          disabled={!isOnline}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
} 