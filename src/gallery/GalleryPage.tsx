import { useState, type ReactNode } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilterX, Pencil, Plus, SearchX, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ApiError } from '@/api/fetcher'
import type { ApiStatus } from '@/api/status'
import { sourceOf, type AnyRecord } from '@/api/sources'
import { useRoles } from '@/auth'
import { ConfirmDialog } from '@/components/app/ConfirmDialog'
import { ApiStatusDetails, ApiStatusIndicator } from '@/components/app/AppFooter'
import { DataState } from '@/components/app/DataState'
import { DetailSkeleton } from '@/components/app/DetailSkeleton'
import { ResourceDetail } from '@/components/app/ResourceDetail'
import { useDocumentTitle } from '@/components/app/useDocumentTitle'
import { PageHeader } from '@/components/app/PageHeader'
import { FormSkeleton } from '@/components/app/form/FormSkeleton'
import { ResourceForm } from '@/components/app/form/ResourceForm'
import { DataTable } from '@/components/app/list/DataTable'
import { ListSkeleton } from '@/components/app/list/ListSkeleton'
import { ResourceList } from '@/components/app/list/ResourceList'
import { useListState } from '@/components/app/list/listState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { tDynamic } from '@/i18n/dynamic'
import { canWrite, formatDisplay, type ResourceKey } from '@/manifest'
import { CreateTaskBody } from '@/test/fixtures/api/tasks.zod'
import { UpdatePersonBody } from '@/test/fixtures/api/persons.zod'
import { persons, removeRecord, tasks } from './data'
import { personsResource, tasksResource } from './register'
import { useGalleryRole, type GalleryRole } from './role'

// Gallery chrome (section titles, notes) is a developer tool and stays in English; the components inside it use
// i18n as in the app.
const sections = [
  ['tokens', 'Colour tokens'],
  ['typography', 'Typography'],
  ['controls', 'Buttons and badges'],
  ['list', 'List'],
  ['detail', 'Detail'],
  ['form', 'Form'],
  ['states', 'States'],
  ['dialogs', 'Confirm dialog and toasts'],
  ['footer', 'Footer: API status'],
] as const

export function GalleryPage() {
  const { role, setRole } = useGalleryRole()
  // Runs after the PageHeaders inside, so the tab is named after the gallery, not the last section.
  useDocumentTitle('Component gallery')
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-page-title">Component gallery</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            The generic components with the persons and tasks fixtures, inside the app shell. Theme and
            language: user menu at the bottom of the sidebar. Rules: docs/DESIGN.md.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gallery-role">Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value as GalleryRole)}>
            <SelectTrigger id="gallery-role" className="w-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="writer">Writer (read + write)</SelectItem>
              <SelectItem value="reader">Reader (read only)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <nav aria-label="Gallery sections" className="-mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {sections.map(([id, title]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline md:min-h-0">
            {title}
          </a>
        ))}
      </nav>
      <TokensSection />
      <TypographySection />
      <ControlsSection />
      <ListSection />
      <DetailSection />
      <FormSection />
      <StatesSection />
      <DialogsSection />
      <FooterSection />
    </div>
  )
}

function Section({ id, children, note }: { id: (typeof sections)[number][0]; children: ReactNode; note?: string }) {
  const title = sections.find(([key]) => key === id)![1]
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 flex flex-col gap-4">
      <div className="border-b pb-2">
        <h2 id={`${id}-title`} className="text-section-title">
          {title}
        </h2>
        {note && <p className="mt-1 max-w-prose text-caption text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

const surfaces = [
  ['bg-background', 'background', 'The page'],
  ['bg-sidebar', 'sidebar', 'Navigation'],
  ['bg-card', 'card', 'Content surfaces'],
  ['bg-popover shadow-md', 'popover', 'Menus, dialogs, sheets'],
  ['bg-muted', 'muted', 'Quiet fills'],
  ['bg-accent', 'accent', 'Hover, selection'],
]
const colours = [
  ['bg-primary text-primary-foreground', 'primary'],
  ['bg-secondary text-secondary-foreground', 'secondary'],
  ['bg-success text-success-foreground', 'success'],
  ['bg-warning text-warning-foreground', 'warning'],
  ['bg-info text-info-foreground', 'info'],
  ['bg-destructive text-destructive-foreground', 'destructive'],
]

function TokensSection() {
  return (
    <Section id="tokens" note="Surfaces from lowest to highest, then the brand and status colours with their foregrounds.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {surfaces.map(([className, name, use]) => (
          <div key={name} className={`rounded-lg border p-3 ${className}`}>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-caption text-muted-foreground">{use}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {colours.map(([className, name]) => (
          <div key={name} className={`rounded-lg p-3 text-sm font-medium ${className}`}>
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {['shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg'].map((shadow) => (
          <div key={shadow} className={`rounded-lg border bg-card p-3 text-sm ${shadow}`}>
            {shadow}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-sm border bg-card px-3 py-2 text-sm">rounded-sm</span>
        <span className="rounded-md border bg-card px-3 py-2 text-sm">rounded-md</span>
        <span className="rounded-lg border bg-card px-3 py-2 text-sm">rounded-lg</span>
        <span className="rounded-xl border bg-card px-3 py-2 text-sm">rounded-xl</span>
        <span className="rounded-full border bg-card px-3 py-2 text-sm">rounded-full</span>
      </div>
    </Section>
  )
}

function TypographySection() {
  const { i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2 })
  return (
    <Section id="typography" note="Inter Variable; numbers in tables and number inputs use tabular figures.">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="text-page-title">Page title: Anna Kowalska</div>
            <div className="text-caption text-muted-foreground">text-page-title, 24/32, semibold</div>
          </div>
          <div>
            <div className="text-section-title">Section title: Address</div>
            <div className="text-caption text-muted-foreground">text-section-title, 16/24, semibold</div>
          </div>
          <div>
            <p className="max-w-prose text-sm">
              Body: collect the numbers from every department and send the summary to the board before the end of the
              month. Ambiguous characters stay apart: Il1 O0.
            </p>
            <div className="text-caption text-muted-foreground">text-sm, 14/20</div>
          </div>
          <div>
            <div className="text-caption text-muted-foreground">Caption: updated 1 October 2026, text-caption, 12/16</div>
          </div>
          <div className="w-fit text-sm tabular-nums">
            {[1234.5, 87.25, 10000].map((n) => (
              <div key={n} className="text-right">
                {number.format(n)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}

function ControlsSection() {
  const { t } = useTranslation()
  return (
    <Section id="controls" note="Status badges use success, warning, info and destructive; the others are neutral.">
      <div className="flex flex-wrap gap-2">
        <Button>
          <Plus aria-hidden />
          {t('common.actions.new')}
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">
          <Pencil aria-hidden />
          {t('common.actions.edit')}
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">
          <Trash2 aria-hidden />
          {t('common.actions.delete')}
        </Button>
        <Button variant="link">Link</Button>
        <Button disabled>{t('common.actions.saving')}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">{tDynamic(t, 'enums.PersonStatus.AVAILABLE')}</Badge>
        <Badge variant="warning">{tDynamic(t, 'enums.Priority.MEDIUM')}</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="destructive">{tDynamic(t, 'enums.Priority.HIGH')}</Badge>
        <Badge variant="secondary">{tDynamic(t, 'enums.PersonStatus.UNAVAILABLE')}</Badge>
        <Badge variant="outline">{tDynamic(t, 'enums.Priority.LOW')}</Badge>
        <Badge>Default</Badge>
      </div>
    </Section>
  )
}

const personFilterValues = { status: ['AVAILABLE', 'UNAVAILABLE'] }

function ListSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const list = useListState(personsResource)
  const source = sourceOf('persons' as ResourceKey)
  const query = useQuery({
    queryKey: source.listKey(list.apiParams),
    queryFn: () => source.list(list.apiParams),
    placeholderData: keepPreviousData,
  })
  return (
    <Section
      id="list"
      note="Table from md, cards below it. Search, filters (with removable chips), sorting, paging and the row menu's delete work on the sample data."
    >
      <div>
        <ResourceList
          resource={personsResource}
          list={list}
          query={query}
          filterValues={personFilterValues}
          remove={async (person: AnyRecord) => removeRecord(persons, person.id)}
          onDeleted={() => void queryClient.invalidateQueries({ queryKey: ['gallery', 'persons'] })}
        />
      </div>
      <h3 className="text-sm font-medium">{tDynamic(t, 'tasks.title')}: relations, boolean badges, numbers</h3>
      <Card className="gap-0 overflow-hidden py-0">
        <DataTable
          resource={tasksResource}
          rows={tasks.slice(0, 5)}
          sort={{ field: 'dueDate', direction: 'asc' }}
          onSortChange={() => {}}
          getRowHref={(task) => `${tasksResource.route}/${task.id}`}
        />
      </Card>
    </Section>
  )
}

/** A gallery detail: the record from the in-memory source; its delete fails as "still in use" (409). */
function GalleryDetail({ resource, record }: { resource: typeof personsResource; record: AnyRecord }) {
  const source = sourceOf(resource.key)
  // Rendered at once (initialData), so the gallery's document title, set after its children, still wins.
  const query = useQuery({ queryKey: source.getKey(record.id), queryFn: () => source.get(record.id), initialData: record })
  return (
    <ResourceDetail
      resource={resource}
      query={query}
      remove={() => Promise.reject(new ApiError(409, 'Conflict', undefined, [{ field: 'id', code: 'in-use', message: 'in use' }]))}
      onDeleted={() => {}}
    />
  )
}

function DetailSection() {
  return (
    <Section
      id="detail"
      note="Header with the status badge and actions (writer only), the fields in section cards (nested objects and metadata in their own), the related list. Delete here fails as still in use."
    >
      <div>
        <GalleryDetail resource={personsResource} record={persons[0]} />
      </div>
      <div>
        <GalleryDetail resource={tasksResource} record={tasks[0]} />
      </div>
    </Section>
  )
}

type SaveOutcome = 'success' | 'fields' | 'stale' | 'server'
const outcomes: Record<SaveOutcome, string> = {
  success: 'Succeeds',
  fields: 'Field errors (400)',
  stale: 'Stale version (409)',
  server: 'Server error (500)',
}

/** What a gallery save does: succeed, or fail the way the API can. */
function fakeSave<T extends { id: number; version: number }>(outcome: SaveOutcome, record: T, body: object): Promise<T> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (outcome === 'fields')
        reject(
          new ApiError(400, 'Validation failed', undefined, [
            { field: 'email', code: 'unique', message: 'must be unique' },
            { field: 'birthDate', code: 'past', message: 'must be a past date' },
          ]),
        )
      else if (outcome === 'stale') reject(new ApiError(409, 'Conflict', 'The record was changed by someone else.'))
      else if (outcome === 'server') reject(new ApiError(500, 'Internal Server Error'))
      else resolve({ ...record, ...body, version: record.version + 1 })
    }, 600),
  )
}

const personEnums = { gender: ['MALE', 'FEMALE', 'OTHER'], status: ['AVAILABLE', 'UNAVAILABLE'] }
const taskEnums = { priority: ['LOW', 'MEDIUM', 'HIGH'] }
const UpdatePersonForm = UpdatePersonBody.omit({ version: true })

function FormSection() {
  const { t } = useTranslation()
  const [outcome, setOutcome] = useState<SaveOutcome>('fields')
  const person = persons[0]
  const newTask = { ...tasks[0], id: tasks.length + 1 }
  return (
    <Section id="form" note="Pick what the next save does, then save the person form: field errors, the stale-version dialog or a form-level alert.">
      <div className="flex flex-col gap-2">
        <Label htmlFor="gallery-outcome">Next save</Label>
        <Select value={outcome} onValueChange={(value) => setOutcome(value as SaveOutcome)}>
          <SelectTrigger id="gallery-outcome" className="w-full md:w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(outcomes).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <PageHeader title={tDynamic(t, 'persons.editTitle', { name: formatDisplay(personsResource.display, person) })} />
        <ResourceForm
          resource={personsResource}
          schema={UpdatePersonForm}
          record={person}
          enumValues={personEnums}
          save={(body) => fakeSave(outcome, person, body)}
          onSaved={() => {}}
          reload={async () => person}
          cancelHref="/__gallery"
        />
      </div>
      <div>
        <PageHeader title={tDynamic(t, 'tasks.newTitle')} />
        <ResourceForm
          resource={tasksResource}
          schema={CreateTaskBody}
          enumValues={taskEnums}
          save={(body) => fakeSave(outcome, newTask, body)}
          onSaved={() => {}}
          cancelHref="/__gallery"
          // The person form above asks before leaving; the router allows one blocker.
          confirmLeave={false}
        />
      </div>
    </Section>
  )
}

function StatesSection() {
  const { t } = useTranslation()
  const roles = useRoles()
  const [retries, setRetries] = useState(0)
  const state = (title: string, children: ReactNode, note?: string) => (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="text-sm font-medium">
        {title}
        {note && <span className="font-normal text-muted-foreground"> · {note}</span>}
      </h3>
      {children}
    </div>
  )
  const inCard = (children: ReactNode) => <Card className="gap-0 overflow-hidden py-0">{children}</Card>
  return (
    <Section id="states" note="Every data view has four states: loading (skeletons shaped like the page), empty, error with retry, data.">
      <div className="grid gap-6 lg:grid-cols-2">
        {state('Loading: list', inCard(<DataState isLoading isError={false} loading={<ListSkeleton rows={3} />} />))}
        {state(
          'Empty: no records',
          inCard(
            <DataState
              isLoading={false}
              isError={false}
              isEmpty
              empty={{
                title: tDynamic(t, 'persons.empty'),
                description: t('common.states.emptyText'),
                action: canWrite(roles, personsResource) && (
                  <Button>
                    <Plus aria-hidden />
                    {t('common.actions.new')}
                  </Button>
                ),
              }}
            />,
          ),
          '"New" for writers only',
        )}
        {state(
          'Empty: filters',
          inCard(
            <DataState
              isLoading={false}
              isError={false}
              isEmpty
              empty={{
                icon: FilterX,
                title: t('common.list.noFilterResultsTitle'),
                description: t('common.list.noFilterResultsText'),
                action: <Button variant="outline">{t('common.list.clearFilters')}</Button>,
              }}
            />,
          ),
        )}
        {state(
          'Empty: search',
          inCard(
            <DataState
              isLoading={false}
              isError={false}
              isEmpty
              empty={{
                icon: SearchX,
                title: t('common.list.noResultsTitle'),
                description: t('common.list.noResultsText', { q: 'Kowalsky' }),
                action: <Button variant="outline">{t('common.list.clearSearch')}</Button>,
              }}
            />,
          ),
        )}
        {state(
          'Error',
          inCard(<DataState isLoading={false} isError onRetry={() => setRetries((n) => n + 1)} />),
          retries > 0 ? `retried ${retries}×` : undefined,
        )}
        {state('Empty: related list', inCard(<div className="p-6"><DataState isLoading={false} isError={false} isEmpty empty={{ title: t('common.detail.noRelated'), compact: true }} /></div>), 'compact empty')}
        {state('Loading: detail', <DetailSkeleton fields={4} />)}
        {state('Loading: form', <FormSkeleton fields={3} />)}
      </div>
    </Section>
  )
}

function DialogsSection() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const name = formatDisplay(personsResource.display, persons[0])
  const confirm = () => {
    setPending(true)
    setTimeout(() => {
      setPending(false)
      setOpen(false)
      toast.success(t('common.toast.deleted', { name }))
    }, 800)
  }
  return (
    <Section id="dialogs" note="Delete always asks and names the record. Toasts follow the theme.">
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" onClick={() => setOpen(true)}>
          <Trash2 aria-hidden />
          {t('common.actions.delete')}
        </Button>
        <Button variant="outline" onClick={() => toast.success(t('common.toast.updated', { name }))}>
          Success toast
        </Button>
        <Button variant="outline" onClick={() => toast.error(t('common.toast.deleteInUse', { name }))}>
          Error toast
        </Button>
        <Button variant="outline" onClick={() => toast.info('Info toast')}>
          Info toast
        </Button>
        <Button variant="outline" onClick={() => toast.warning('Warning toast')}>
          Warning toast
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('common.delete.title', { name })}
        description={t('common.delete.text')}
        confirmLabel={t('common.actions.delete')}
        destructive
        pending={pending}
        onConfirm={confirm}
      />
    </Section>
  )
}

// The shell's footer below shows the gallery's fixture status (src/gallery/register.ts); here every state.
const apiStatuses: [string, ApiStatus | undefined][] = [
  ['Available', { state: 'available', version: '3.4.2', versionSource: 'api' }],
  ['Degraded', { state: 'degraded', version: '3.4.2', versionSource: 'api', problem: { key: 'down', detail: 'db: DOWN' } }],
  ['Unavailable', { state: 'unavailable', version: '3.4.2', versionSource: 'contract', problem: { key: 'network' } }],
  ['Checking', undefined],
]
const checkedAt = Date.UTC(2026, 9, 27, 9, 30)

function FooterSection() {
  return (
    <Section
      id="footer"
      note="The API status in the footer: a dot with its name, the button opens versions and the problem (below, open). Health is checked every 30 s from /actuator/health, the version read from /actuator/info."
    >
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 py-3 text-caption text-muted-foreground">
          {apiStatuses.map(([title, status]) => (
            <div key={title} className="flex items-center gap-2">
              <span className="sr-only">{title}:</span>
              <ApiStatusIndicator status={status} checkedAt={status && checkedAt} />
            </div>
          ))}
        </CardContent>
      </Card>
      {/* The degraded button's popover, shown open (its classes from components/ui/popover.tsx). */}
      <div className="mt-4 w-full max-w-88 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
        <ApiStatusDetails status={apiStatuses[1][1]} checkedAt={checkedAt} contractVersion="3.4.2" />
      </div>
    </Section>
  )
}
