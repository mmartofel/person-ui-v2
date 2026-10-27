import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { Separator } from '@/components/ui/separator'
import { isMac, SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { resources } from '@/manifest'
import { AppBreadcrumbs } from './AppBreadcrumbs'
import { AppFooter } from './AppFooter'
import { AppSidebar } from './AppSidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { resourcePage, type PageKind } from './resourcePage'

// The desktop sidebar's expanded/collapsed state, remembered like the theme and the language.
const SIDEBAR_STORAGE_KEY = 'sidebar'

function storedOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'collapsed'
  } catch {
    return true
  }
}

function storeOpen(open: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? 'expanded' : 'collapsed')
  } catch {
    // Ignore: the state is then not remembered.
  }
}

// Content width on very wide screens: lists use the room, a record reads better narrower, a form narrower still.
const contentWidth: Record<PageKind | 'other', string> = {
  list: 'max-w-7xl',
  other: 'max-w-7xl',
  detail: 'max-w-6xl',
  new: 'max-w-4xl',
  edit: 'max-w-4xl',
}

/**
 * Opens the sheet below `lg` ("Open menu", with aria-expanded); from `lg` collapses the sidebar to icons, its label
 * naming the action ("Collapse/Expand navigation"; Ctrl/⌘+B in the tooltip). 44 px up to `lg`, where it opens the sheet.
 */
function NavTrigger() {
  const { t } = useTranslation()
  const { isMobile, open, openMobile } = useSidebar()
  if (isMobile) {
    return <SidebarTrigger className="md:size-11" aria-label={t('common.nav.openMenu')} aria-expanded={openMobile} />
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger aria-label={open ? t('common.nav.collapse') : t('common.nav.expand')} />
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('common.nav.shortcut', { keys: isMac ? '⌘B' : 'Ctrl+B' })}</TooltipContent>
    </Tooltip>
  )
}

/** Sidebar (navigation, user menu) plus a header with breadcrumbs, the page, and a footer with versions and API status. */
export function AppShell() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(storedOpen)
  const page = resourcePage(pathname, resources)

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    storeOpen(value)
  }

  return (
    <SidebarProvider open={open} onOpenChange={onOpenChange}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-popover text-popover-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:shadow-md focus:ring-[3px] focus:ring-ring focus:outline-none"
      >
        {t('common.skipToContent')}
      </a>

      <AppSidebar />

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-2 sm:px-4 lg:px-6">
          <NavTrigger />
          {page && (
            <>
              <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
              <AppBreadcrumbs page={page} />
            </>
          )}
        </header>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none md:px-6 lg:px-8">
          <div className={cn('mx-auto w-full', contentWidth[page?.kind ?? 'other'])}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}
