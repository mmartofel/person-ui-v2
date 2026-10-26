import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { defaultLanguage, isLanguage, languages, type Language } from '@/i18n/resources'

/**
 * The language choice of the user menu (the languages of `app.languages`, remembered by i18n): a submenu, or with
 * `inline` a labelled group in the menu itself (in the narrow sheet, where a submenu would leave the screen).
 */
export function LanguageMenu({ inline = false }: { inline?: boolean }) {
  const { t, i18n } = useTranslation()
  const current: Language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : defaultLanguage
  const choices = (
    <DropdownMenuRadioGroup
      value={current}
      onValueChange={(value) => isLanguage(value) && void i18n.changeLanguage(value)}
    >
      {languages.map((language) => (
        <DropdownMenuRadioItem key={language} value={language} lang={language}>
          {t(`common.language.${language}`)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )

  if (inline) {
    return (
      <>
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('common.language.label')}
        </DropdownMenuLabel>
        {choices}
      </>
    )
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages aria-hidden />
        {t('common.language.label')}
        <span className="ml-auto text-muted-foreground">{t(`common.language.${current}`)}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>{choices}</DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
