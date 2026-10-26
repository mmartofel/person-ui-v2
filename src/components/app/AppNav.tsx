import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router'
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useRoles } from '@/auth'
import { canRead, resources } from '@/manifest'
import { getIcon } from '@/manifest/icons'
import { tDynamic } from '@/i18n/dynamic'

/** Navigation built from ui-manifest.yaml: the resources the user can read, in `nav.order`. */
export function AppNav() {
  const { t } = useTranslation()
  const roles = useRoles()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const items = resources.filter((resource) => canRead(roles, resource))

  // Nothing at all when there is nothing to show (e.g. no resources yet): an empty landmark is still announced.
  if (items.length === 0) return null
  return (
    <nav aria-label={t('common.nav.label')}>
      <SidebarGroup>
        <SidebarMenu>
          {items.map((resource) => {
            const Icon = getIcon(resource.nav.icon)
            const title = tDynamic(t, `${resource.key}.title`)
            const active = pathname === resource.route || pathname.startsWith(`${resource.route}/`)
            return (
              <SidebarMenuItem key={resource.key}>
                {/* NavLink sets aria-current="page" on the list; isActive also marks its records. */}
                <SidebarMenuButton asChild isActive={active} tooltip={title} className="font-medium">
                  <NavLink to={resource.route} onClick={() => isMobile && setOpenMobile(false)}>
                    <Icon aria-hidden />
                    <span>{title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  )
}
