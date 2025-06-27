import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User } from '@supabase/supabase-js'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Button } from './button'
import { Command, CommandEmpty, CommandGroup, CommandItem } from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { useLanguage } from '../../hooks/use-language'
import { Language, LanguageInfo } from '../../lib/i18n'
import { cn } from '../../lib/utils'

interface LanguageSelectorProps {
  user?: User | null
  className?: string
  variant?: 'default' | 'compact'
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  user,
  className,
  variant = 'default'
}) => {
  const { t } = useTranslation()
  const { currentLanguage, supportedLanguages, changeLanguage, isChangingLanguage } = useLanguage(user)
  const [open, setOpen] = useState(false)

  const currentLanguageInfo = supportedLanguages.find(lang => lang.code === currentLanguage)

  const handleLanguageSelect = async (language: Language) => {
    if (language !== currentLanguage) {
      await changeLanguage(language)
    }
    setOpen(false)
  }

  const renderLanguageOption = (lang: LanguageInfo, isSelected: boolean) => (
    <div className="flex items-center gap-3">
      <span className="text-lg">{lang.flag}</span>
      <div className="flex flex-col">
        <span className="font-medium">{lang.name}</span>
        {variant === 'default' && (
          <span className="text-sm text-muted-foreground">{lang.nativeName}</span>
        )}
      </div>
      {isSelected && <Check className="ml-auto h-4 w-4" />}
    </div>
  )

  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
            disabled={isChangingLanguage}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="text-lg">{currentLanguageInfo?.flag}</span>
              <span className="hidden sm:inline">{currentLanguageInfo?.name}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0">
          <Command>
            <CommandEmpty>{t('settings.selectLanguage')}</CommandEmpty>
            <CommandGroup>
              {supportedLanguages.map((lang) => (
                <CommandItem
                  key={lang.code}
                  value={lang.code}
                  onSelect={() => handleLanguageSelect(lang.code)}
                  className="cursor-pointer"
                >
                  {renderLanguageOption(lang, lang.code === currentLanguage)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{t('settings.language')}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isChangingLanguage}
          >
            {currentLanguageInfo ? (
              <div className="flex items-center gap-3">
                <span className="text-lg">{currentLanguageInfo.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{currentLanguageInfo.name}</span>
                  <span className="text-sm text-muted-foreground">{currentLanguageInfo.nativeName}</span>
                </div>
              </div>
            ) : (
              t('settings.selectLanguage')
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandEmpty>{t('settings.selectLanguage')}</CommandEmpty>
            <CommandGroup>
              {supportedLanguages.map((lang) => (
                <CommandItem
                  key={lang.code}
                  value={lang.code}
                  onSelect={() => handleLanguageSelect(lang.code)}
                  className="cursor-pointer"
                >
                  {renderLanguageOption(lang, lang.code === currentLanguage)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {isChangingLanguage && (
        <p className="text-sm text-muted-foreground">{t('common.updating')}</p>
      )}
    </div>
  )
} 