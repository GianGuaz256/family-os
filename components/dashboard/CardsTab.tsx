import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { VirtualCard } from '../ui/VirtualCard'
import { BarcodeScanner } from '../ui/BarcodeScanner'
import { AppHeader } from '../ui/AppHeader'
import { AppConfig } from '../../lib/app-types'
import { CreditCard, Plus, Trash2, Edit, X, FileText, QrCode } from 'lucide-react'

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
  appConfig?: AppConfig
}

export const CardsTab: React.FC<CardsTabProps> = ({
  cards,
  groupId,
  onUpdate,
  isOnline,
  appConfig
}) => {
  const [showScanModal, setShowScanModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFullscreenCard, setShowFullscreenCard] = useState<LoyaltyCard | null>(null)
  const [editingCard, setEditingCard] = useState<LoyaltyCard | null>(null)
  const [barcodeScanned, setBarcodeScanned] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    card_number: '',
    barcode: '',
    points_balance: '',
    expiry_date: '',
    notes: ''
  })

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'card') {
        setShowAddModal(true)
      } else if (event.detail.type === 'scan') {
        setShowScanModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [])

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
    setEditingCard(null)
    setShowFullscreenCard(null)
    setBarcodeScanned(false)
  }

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({
      ...prev,
      barcode: barcode,
      name: prev.name || 'Loyalty Card' // Provide a default name if none exists
    }))
    setBarcodeScanned(true) // Mark that we've scanned a barcode
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
    <div className="space-y-6">
      {/* App Header with icon and styling */}
      {appConfig && (
        <AppHeader
          title={appConfig.name}
          appIcon={appConfig.icon}
          appColor={appConfig.color}
          appDescription={appConfig.description}
          transparent={true}
          showUserControls={false}
        />
      )}
      
      {!appConfig && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Loyalty Cards</h2>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold mb-2">
            No cards yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Add your first loyalty card to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card 
              key={card.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowFullscreenCard(card)}
            >
              <CardContent className="p-6">
                <VirtualCard
                  name={card.name}
                  brand={card.brand}
                  cardNumber={card.card_number}
                  barcode={card.barcode}
                  pointsBalance={card.points_balance}
                  expiryDate={card.expiry_date}
                  size="small"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scan Modal */}
      <Dialog
        open={showScanModal}
        onOpenChange={(open) => {
          setShowScanModal(open)
          if (!open) {
            setBarcodeScanned(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          {/* Barcode Scanner */}
          {!barcodeScanned && (
            <BarcodeScanner
              isActive={true}
              onScanSuccess={handleBarcodeScanned}
              onCancel={() => setShowScanModal(false)}
              onError={(error) => console.error('Barcode scan error:', error)}
            />
          )}

          {/* Barcode Scanned Form */}
          {barcodeScanned && (
            <div className="space-y-4">
              <div className="w-full h-20 bg-green-50 dark:bg-green-950/50 border-2 border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Barcode Scanned Successfully!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scan-card-name">Card Name *</Label>
                  <Input
                    id="scan-card-name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Store or brand name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scan-brand">Brand</Label>
                  <Input
                    id="scan-brand"
                    value={formData.brand}
                    onChange={(e) => handleFormChange('brand', e.target.value)}
                    placeholder="Brand name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scan-barcode">Barcode</Label>
                  <Input
                    id="scan-barcode"
                    value={formData.barcode}
                    onChange={(e) => handleFormChange('barcode', e.target.value)}
                    placeholder="Barcode number"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scan-points">Points Balance</Label>
                  <Input
                    id="scan-points"
                    value={formData.points_balance}
                    onChange={(e) => handleFormChange('points_balance', e.target.value)}
                    placeholder="Current points/balance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scan-expiry">Expiry Date</Label>
                  <Input
                    id="scan-expiry"
                    value={formData.expiry_date}
                    onChange={(e) => handleFormChange('expiry_date', e.target.value)}
                    placeholder="MM/YY or MM/YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scan-notes">Notes</Label>
                  <Input
                    id="scan-notes"
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
                  disabled={!formData.name.trim()}
                >
                  Save Card
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBarcodeScanned(false)
                    resetForm()
                  }}
                >
                  Scan Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowScanModal(false)
                    setBarcodeScanned(false)
                    resetForm()
                  }}
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
          setShowAddModal(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? "Edit Card" : "Add New Card"}</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-card-name">Card Name *</Label>
            <Input
              id="manual-card-name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Store or brand name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-brand">Brand</Label>
            <Input
              id="manual-brand"
              value={formData.brand}
              onChange={(e) => handleFormChange('brand', e.target.value)}
              placeholder="Brand name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-card-number">Card Number</Label>
            <Input
              id="manual-card-number"
              value={formData.card_number}
              onChange={(e) => handleFormChange('card_number', e.target.value)}
              placeholder="Member/card number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-barcode">Barcode</Label>
            <Input
              id="manual-barcode"
              value={formData.barcode}
              onChange={(e) => handleFormChange('barcode', e.target.value)}
              placeholder="Barcode number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-points">Points Balance</Label>
            <Input
              id="manual-points"
              value={formData.points_balance}
              onChange={(e) => handleFormChange('points_balance', e.target.value)}
              placeholder="Current points/balance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-expiry">Expiry Date</Label>
            <Input
              id="manual-expiry"
              value={formData.expiry_date}
              onChange={(e) => handleFormChange('expiry_date', e.target.value)}
              placeholder="MM/YY or MM/YYYY"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-notes">Notes</Label>
            <Input
              id="manual-notes"
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
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-0">
            <DialogTitle className="text-xl font-semibold">{showFullscreenCard?.name || ''}</DialogTitle>
          </DialogHeader>
          {showFullscreenCard && (
            <div className="space-y-6">

              {/* Card Display */}
              <div className="mb-6">
                <VirtualCard
                  name={showFullscreenCard.name}
                  brand={showFullscreenCard.brand}
                  cardNumber={showFullscreenCard.card_number}
                  barcode={showFullscreenCard.barcode}
                  pointsBalance={showFullscreenCard.points_balance}
                  expiryDate={showFullscreenCard.expiry_date}
                  size="large"
                />
              </div>

              {/* Management Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Gestisci</h3>
                <div className="space-y-0 border border-border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      editCard(showFullscreenCard)
                      setShowFullscreenCard(null)
                    }}
                    className="w-full flex items-center justify-between py-4 px-4 h-auto rounded-none border-b border-border hover:bg-muted transition-colors"
                    disabled={!isOnline}
                  >
                    <div className="flex items-center gap-3">
                      <Edit className="h-5 w-5" />
                      <span className="text-base">Modifica carta</span>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowFullscreenCard(null)
                      setShowScanModal(true)
                    }}
                    className="w-full flex items-center justify-between py-4 px-4 h-auto rounded-none border-b border-border hover:bg-muted transition-colors"
                    disabled={!isOnline}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="h-5 w-5" />
                      <span className="text-base">Scan Barcode</span>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between py-4 px-4 h-auto rounded-none border-b border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5" />
                      <span className="text-base">Nota</span>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Sei sicuro di voler eliminare questa carta?')) {
                        deleteCard(showFullscreenCard.id)
                        setShowFullscreenCard(null)
                      }
                    }}
                    className="w-full flex items-center justify-between py-4 px-4 h-auto rounded-none text-destructive hover:bg-destructive/10 transition-colors"
                    disabled={!isOnline}
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5" />
                      <span className="text-base">Elimina carta</span>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>

              {showFullscreenCard.notes && (
                <div className="mb-6">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> {showFullscreenCard.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 