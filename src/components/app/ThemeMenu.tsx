import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { themes, useTheme, type Theme } from './theme/theme-context'

const icons = { light: Sun, dark: Moon, system: Monitor } satisfies Record<Theme, unknown>

/** The theme choice of the user menu (light, dark, system): a submenu, or with `inline` a labelled group. */
export function ThemeMenu({ inline = false }: { inline?: boolean }) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const Icon = icons[theme]
  const choices = (
    <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
      {themes.map((option) => {
        const OptionIcon = icons[option]
        return (
          <DropdownMenuRadioItem key={option} value={option}>
            <OptionIcon aria-hidden />
            {t(`common.theme.${option}`)}
          </DropdownMenuRadioItem>
        )
      })}
    </DropdownMenuRadioGroup>
  )

  if (inline) {
    return (
      <>
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('common.theme.label')}
        </DropdownMenuLabel>
        {choices}
      </>
    )
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Icon aria-hidden />
        {t('common.theme.label')}
        <span className="ml-auto text-muted-foreground">{t(`common.theme.${theme}`)}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>{choices}</DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
