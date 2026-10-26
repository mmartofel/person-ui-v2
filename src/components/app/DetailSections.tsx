import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { fieldLabelKey, groupLabelKey, tDynamic } from '@/i18n/dynamic'
import { detailSections, getPath, objectFields, type Resource } from '@/manifest'
import { renderFieldValue } from './formatValue'
import { SectionCard } from './SectionCard'

/**
 * The manifest's `detail.fields` of one record as section cards (`detailSections`): the top-level fields, one card per
 * nested object, and the server-set metadata (`form.readOnly`), which sits in a narrow column beside them from `lg`.
 */
export function DetailSections({ resource, record }: { resource: Resource; record: object }) {
  const { t } = useTranslation()
  const { main, objects, meta } = detailSections(resource)

  const cards = (
    <div className="flex min-w-0 flex-col gap-6">
      {main.length > 0 && (
        <SectionCard title={t('common.detail.details')}>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {main.map((field) => (
              <DetailItem key={field} resource={resource} record={record} path={field} />
            ))}
          </dl>
        </SectionCard>
      )}
      {objects.map((object) => {
        const subFields = objectFields(resource, object)!
        // An object without any value is one "Not provided", not one per sub-field.
        const isEmpty = subFields.every((subField) => getPath(record, `${object}.${subField}`) == null)
        return (
          <SectionCard key={object} title={tDynamic(t, groupLabelKey(resource.key, object))}>
            {isEmpty ? (
              <p className="text-muted-foreground italic">{t('common.detail.empty')}</p>
            ) : (
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {subFields.map((subField) => (
                  <DetailItem key={subField} resource={resource} record={record} path={`${object}.${subField}`} />
                ))}
              </dl>
            )}
          </SectionCard>
        )
      })}
    </div>
  )
  if (meta.length === 0) return cards

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      {cards}
      <SectionCard title={t('common.detail.metadata')}>
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
          {meta.map((field) => (
            <DetailItem key={field} resource={resource} record={record} path={field} />
          ))}
        </dl>
      </SectionCard>
    </div>
  )
}

function DetailItem({ resource, record, path }: { resource: Resource; record: object; path: string }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const value = renderFieldValue(resource, path, getPath(record, path), t, language)
  return <DetailEntry label={tDynamic(t, fieldLabelKey(resource.key, path))} value={value} />
}

function DetailEntry({ label, value }: { label: string; value: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      {/* pre-line keeps the line breaks of long text (a textarea's value). */}
      <dd className={value ? 'mt-1 break-words whitespace-pre-line' : 'mt-1 text-muted-foreground italic'}>
        {value || t('common.detail.empty')}
      </dd>
    </div>
  )
}
