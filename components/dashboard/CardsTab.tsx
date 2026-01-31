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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { VirtualCard } from '../ui/VirtualCard'
import { SimpleBarcodeScanner } from '../ui/SimpleBarcodeScanner'
import { AppHeader } from '../ui/AppHeader'
import { AppConfig } from '../../lib/app-types'
import { validateLoyaltyCard, fieldValidators } from '../../lib/card-validation'
import { CreditCard, Plus, Trash2, Edit, X, FileText, QrCode, Camera, FileEdit } from 'lucide-react'

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
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFullscreenCard, setShowFullscreenCard] = useState<LoyaltyCard | null>(null)
  const [editingCard, setEditingCard] = useState<LoyaltyCard | null>(null)
  const [activeTab, setActiveTab] = useState<string>('scan')
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    card_number: '',
    barcode: '',
    points_balance: '',
    expiry_date: '',
    notes: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'card') {
        setActiveTab('manual')
        setShowAddModal(true)
      } else if (event.detail.type === 'scan') {
        setActiveTab('scan')
        setShowAddModal(true)
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
    setValidationErrors({})
    setActiveTab('scan')
  }

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({
      ...prev,
      barcode: barcode,
      name: prev.name || 'Loyalty Card'
    }))
    setActiveTab('manual')
  }



  const saveCard = async () => {
    if (!isOnline) return

    setIsSaving(true)
    setValidationErrors({})

    // Validate data
    const validation = validateLoyaltyCard(formData)
    
    if (!validation.success) {
      setValidationErrors(validation.errors)
      setIsSaving(false)
      return
    }

    try {
      const cardData = {
        group_id: groupId,
        ...validation.data
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
      setShowAddModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error saving card:', error)
      setValidationErrors({ general: ['Failed to save card. Please try again.'] })
    } finally {
      setIsSaving(false)
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
    setActiveTab('manual')
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

      {/* Add/Edit Card Modal with Tabs */}
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCard ? "Edit Card" : "Add Loyalty Card"}</DialogTitle>
          </DialogHeader>

          {validationErrors.general && (
            <Alert className="border-destructive/50 text-destructive">
              <AlertDescription>{validationErrors.general[0]}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan" disabled={!!editingCard}>
                <Camera className="h-4 w-4 mr-2" />
                Scan
              </TabsTrigger>
              <TabsTrigger value="manual">
                <FileEdit className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
            </TabsList>

            {/* Scan Tab */}
            <TabsContent value="scan" className="space-y-4">
              <SimpleBarcodeScanner
                onScanSuccess={handleBarcodeScanned}
                onCancel={() => setShowAddModal(false)}
                onError={(error) => console.error('Barcode scan error:', error)}
              />
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-name">
                    Card Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="card-name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="e.g., Tesco Clubcard, Nectar Card"
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive">{validationErrors.name[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand / Store</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleFormChange('brand', e.target.value)}
                    placeholder="e.g., Tesco, Sainsbury's, Lidl"
                  />
                  {validationErrors.brand && (
                    <p className="text-sm text-destructive">{validationErrors.brand[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number">Member Number</Label>
                  <Input
                    id="card-number"
                    value={formData.card_number}
                    onChange={(e) => handleFormChange('card_number', e.target.value)}
                    placeholder="Your member/card number"
                  />
                  {validationErrors.card_number && (
                    <p className="text-sm text-destructive">{validationErrors.card_number[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode Number</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleFormChange('barcode', e.target.value)}
                    placeholder="Barcode number (8-20 digits)"
                  />
                  {validationErrors.barcode && (
                    <p className="text-sm text-destructive">{validationErrors.barcode[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Points Balance</Label>
                  <Input
                    id="points"
                    value={formData.points_balance}
                    onChange={(e) => handleFormChange('points_balance', e.target.value)}
                    placeholder="Current points (numbers only)"
                  />
                  {validationErrors.points_balance && (
                    <p className="text-sm text-destructive">{validationErrors.points_balance[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    value={formData.expiry_date}
                    onChange={(e) => handleFormChange('expiry_date', e.target.value)}
                    placeholder="YYYY-MM-DD or MM/YY"
                  />
                  {validationErrors.expiry_date && (
                    <p className="text-sm text-destructive">{validationErrors.expiry_date[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Additional notes or benefits"
                  />
                  {validationErrors.notes && (
                    <p className="text-sm text-destructive">{validationErrors.notes[0]}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={saveCard} 
                    className="flex-1" 
                    disabled={isSaving || !isOnline}
                  >
                    {isSaving ? 'Saving...' : editingCard ? "Update Card" : "Save Card"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>

                {!isOnline && (
                  <p className="text-sm text-muted-foreground text-center">
                    You need to be online to save cards
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
                      setActiveTab('scan')
                      setShowAddModal(true)
                    }}
                    className="w-full flex items-center justify-between py-4 px-4 h-auto rounded-none border-b border-border hover:bg-muted transition-colors"
                    disabled={!isOnline}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="h-5 w-5" />
                      <span className="text-base">Update Barcode</span>
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