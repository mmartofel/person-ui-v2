import { useId, type ReactNode } from 'react'
import { useController, useWatch, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { CountrySelect } from '@/components/app/CountrySelect'
import { RelationSelect } from '@/components/app/RelationSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { enumLabelKey, fieldLabelKey, groupLabelKey, tDynamic } from '@/i18n/dynamic'
import { cn } from '@/lib/utils'
import { isObjectGroup, type Resource } from '@/manifest'

// Radix Select cannot use '' as an item value; this stands for "no value" in the UI only.
const NONE = '__none__'

const groupColumns: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }

interface FormFieldsProps<T extends FieldValues, TOut extends FieldValues> {
  resource: Resource
  control: Control<T, unknown, TOut>
  /** Field paths the schema requires (see `isRequired`). */
  required: readonly string[]
  /** Allowed values of each enum field, from the generated model (e.g. `Object.values(PersonCreateRequestGender)`). */
  enumValues?: Record<string, readonly string[]>
  /** `min`/`max`/`step` of number inputs by path, from the schema (see `numberLimits`). */
  numberLimits?: Record<string, NumberLimits>
  /** Names of the records relation inputs start with, by path (from the record's embedded references). */
  relationLabels?: Record<string, string | undefined>
}

export interface NumberLimits {
  min?: number
  max?: number
  step?: number
}

/**
 * All form fields of a resource as section cards, laid out by the manifest's `form.groups`: one column on mobile, a
 * row from `md`. A nested object's group is a fieldset card; its fields are named by their path (`address.city`).
 */
export function FormFields<T extends FieldValues, TOut extends FieldValues = T>({
  resource,
  control,
  required,
  enumValues = {},
  numberLimits = {},
  relationLabels = {},
}: FormFieldsProps<T, TOut>) {
  const { t } = useTranslation()
  const row = (fields: string[]) => (
    <div key={fields.join()} className={cn('grid gap-5', groupColumns[fields.length])}>
      {fields.map((field) => (
        <FormField
          key={field}
          resource={resource}
          name={field as Path<T>}
          control={control}
          required={required.includes(field)}
          options={enumValues[field]}
          limits={numberLimits[field]}
          relationLabel={relationLabels[field]}
        />
      ))}
    </div>
  )

  // As on the detail page: the top-level rows in one "Details" card, then a titled card per nested object.
  const rows = resource.form.groups.filter((group): group is string[] => !isObjectGroup(group))
  const objects = resource.form.groups.filter(isObjectGroup)

  return (
    <>
      {rows.length > 0 && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2>{t('common.form.details')}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">{rows.map(row)}</CardContent>
        </Card>
      )}
      {objects.map((group) => (
        // A fieldset styled as a card; the floated legend sits inside it like a card title.
        <fieldset key={group.object} className="min-w-0 rounded-xl border bg-card py-6 text-card-foreground shadow-sm">
          <legend className="float-left mb-6 w-full px-6 text-section-title">
            {tDynamic(t, groupLabelKey(resource.key, group.object))}
          </legend>
          <div className="clear-both flex flex-col gap-5 px-6">
            {group.groups.map((fields) => row(fields.map((field) => `${group.object}.${field}`)))}
          </div>
        </fieldset>
      ))}
    </>
  )
}

interface FormFieldProps<T extends FieldValues, TOut extends FieldValues> {
  resource: Resource
  name: Path<T>
  control: Control<T, unknown, TOut>
  required: boolean
  options?: readonly string[]
  limits?: NumberLimits
  relationLabel?: string
}

function FormField<T extends FieldValues, TOut extends FieldValues>({
  resource,
  name,
  control,
  required,
  options = [],
  limits,
  relationLabel,
}: FormFieldProps<T, TOut>) {
  const { t } = useTranslation()
  const id = useId()
  const errorId = `${id}-error`
  // Destructured: the React Compiler lint treats the whole `field` object as a ref because it carries `ref`.
  const {
    field: { ref, value, onChange, onBlur, name: inputName },
    fieldState,
  } = useController({
    name,
    control,
    // Fields that must not be earlier than this one are validated again when it changes.
    rules: { deps: dependents(resource, name) as Path<T>[] },
  })
  const config = resource.form.fields?.[name] ?? { input: 'text' as const }
  // The earliest allowed date (`notBefore`); the hook needs a name even when the field has no such rule.
  const earliest = useWatch({ control, name: (config.notBefore ?? name) as Path<T> }) as unknown
  const invalid = !!fieldState.error
  const a11y = {
    id,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
    'aria-describedby': invalid ? errorId : undefined,
  }

  let input: ReactNode
  if (config.input === 'select') {
    input = (
      <Select
        value={value || (config.allowEmpty ? NONE : '')}
        onValueChange={(next) => onChange(next === NONE ? '' : next)}
      >
        <SelectTrigger {...a11y} ref={ref} onBlur={onBlur} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {config.allowEmpty && <SelectItem value={NONE}>{t('common.form.none')}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {config.enum ? tDynamic(t, enumLabelKey(config.enum, option)) : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  } else if (config.input === 'checkbox') {
    // The label sits next to the box and fills the 44px-high row, so the whole row toggles it.
    return (
      <div data-form-field className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-3">
          <Checkbox
            {...a11y}
            ref={ref}
            name={inputName}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
            onBlur={onBlur}
          />
          <Label htmlFor={id} className="min-h-11 flex-1 cursor-pointer">
            {tDynamic(t, fieldLabelKey(resource.key, name))}
          </Label>
        </div>
        {fieldState.error?.message && (
          <p id={errorId} className="text-sm text-destructive">
            {fieldState.error.message}
          </p>
        )}
      </div>
    )
  } else if (config.input === 'textarea') {
    input = (
      <Textarea {...a11y} ref={ref} name={inputName} value={value ?? ''} onChange={onChange} onBlur={onBlur} rows={4} />
    )
  } else if (config.input === 'relation' && config.resource) {
    input = (
      <RelationSelect
        {...a11y}
        ref={ref}
        resource={config.resource}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        label={relationLabel}
        allowEmpty={config.allowEmpty ?? !required}
      />
    )
  } else if (config.input === 'country') {
    input = (
      <CountrySelect
        {...a11y}
        ref={ref}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        allowEmpty={!required}
      />
    )
  } else {
    input = (
      <Input
        {...a11y}
        ref={ref}
        name={inputName}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        type={config.input === 'date' ? 'date' : config.input === 'number' ? 'number' : 'text'}
        inputMode={config.input === 'number' ? 'decimal' : undefined}
        min={config.notBefore && typeof earliest === 'string' && earliest ? earliest : limits?.min}
        max={limits?.max}
        step={limits?.step ?? (config.input === 'number' ? 'any' : undefined)}
        className={config.input === 'number' ? 'tabular-nums' : undefined}
      />
    )
  }

  return (
    <div data-form-field className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>
        {tDynamic(t, fieldLabelKey(resource.key, name))}
        {required && (
          <>
            <span aria-hidden className="text-destructive">
              *
            </span>
            <span className="sr-only">({t('common.form.required')})</span>
          </>
        )}
      </Label>
      {input}
      {fieldState.error?.message && (
        <p id={errorId} className="text-sm text-destructive">
          {fieldState.error.message}
        </p>
      )}
    </div>
  )
}

/** Fields whose `notBefore` rule names this one. */
const dependents = (resource: Resource, name: string) =>
  Object.entries(resource.form.fields ?? {})
    .filter(([, config]) => config.notBefore === name)
    .map(([field]) => field)
