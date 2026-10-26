import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { initials } from '@/lib/initials'
import { app } from '@/manifest'
import { AppNav } from './AppNav'
import { UserMenu } from './UserMenu'

/** The app mark (initials of `app.name` on the brand colour) and the name, linking to the start page. */
function AppMark() {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarMenuButton asChild size="lg" tooltip={app.name}>
      <Link to="/" onClick={() => isMobile && setOpenMobile(false)}>
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
        >
          {initials(app.name)}
        </span>
        <span className="truncate font-semibold tracking-tight">{app.name}</span>
      </Link>
    </SidebarMenuButton>
  )
}

/** Navigation: a sidebar from `lg` (collapsible to icons), an off-canvas sheet below it. */
export function AppSidebar() {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {isMobile ? (
          // The sheet is a dialog: its title names it and the close button is labelled (CLAUDE.md).
          <SheetHeader className="flex-row items-center gap-2 p-0">
            <SheetTitle className="min-w-0 flex-1">
              <AppMark />
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="md:size-11" aria-label={t('common.nav.closeMenu')}>
                <X aria-hidden />
              </Button>
            </SheetClose>
          </SheetHeader>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <AppMark />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <AppNav />
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail title={t('common.nav.toggle')} />
    </Sidebar>
  )
}
