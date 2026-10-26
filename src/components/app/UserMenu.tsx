import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth, useRoles } from '@/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { tDynamic } from '@/i18n/dynamic'
import { initials } from '@/lib/initials'
import { resources } from '@/manifest'
import { LanguageMenu } from './LanguageMenu'
import { ThemeMenu } from './ThemeMenu'

/** The sidebar footer: who is signed in and with which roles; language, theme and logout inside. */
export function UserMenu() {
  const { t } = useTranslation()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { isMobile, state } = useSidebar()
  const iconOnly = !isMobile && state === 'collapsed'
  // Only roles the manifest knows are shown (Keycloak adds technical ones such as offline_access); each one needs a
  // `common.roles.<role>` label. Read on render, not on import: the gallery adds its fixture resources later.
  const appRoles = new Set(resources.flatMap((r) => [...r.permissions.read, ...r.permissions.write]))
  const roles = useRoles().filter((role) => appRoles.has(role))
  const profile = auth.user?.profile
  const name = profile?.name ?? profile?.preferred_username ?? ''
  const roleLabel = roles.length
    ? roles.map((role) => tDynamic(t, `common.roles.${role}`)).join(', ')
    : t('common.user.noRoles')

  const logout = () => {
    queryClient.clear()
    void auth.signoutRedirect()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground"
              >
                {initials(name)}
              </span>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-caption truncate text-muted-foreground">{roleLabel}</span>
              </span>
              {/* Named by its visible text (name, roles; the initials are hidden) plus this, so the name contains
                  every word on the button (WCAG 2.5.3, axe label-content-name-mismatch). */}
              <span className="sr-only"> – {t('common.user.menu')}</span>
              <ChevronsUpDown aria-hidden className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={iconOnly ? 'right' : 'top'}
            align={iconOnly ? 'end' : 'start'}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="truncate font-medium">{name}</div>
              {profile?.email && <div className="truncate text-xs text-muted-foreground">{profile.email}</div>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              <div className="text-xs text-muted-foreground">{t('common.user.roles')}</div>
              <div className="text-sm">{roleLabel}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* In the narrow sheet a submenu would leave the screen, so the choices are listed in the menu itself. */}
            <LanguageMenu inline={isMobile} />
            {isMobile && <DropdownMenuSeparator />}
            <ThemeMenu inline={isMobile} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <LogOut aria-hidden />
              {t('common.user.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
