import { AppLayout } from '@/components/ui/AppLayout'
import { PastelDemo } from '@/components/ui/PastelDemo'
import { useAppNavigation } from '@/hooks/useAppNavigation'

export default function DemoPage() {
  const { handleBack } = useAppNavigation()

  return (
    <AppLayout 
      title="UI Components Demo"
      showBackButton={true}
      onBack={handleBack}
      showUserControls={false}
      transparentHeader={false}
    >
      <PastelDemo />
    </AppLayout>
  )
} 