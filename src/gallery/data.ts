// Sample persons and tasks for the component gallery, shaped like the reference API's responses
// (src/test/fixtures/api). Deterministic, so screenshots stay stable.
import type { ResourceSource } from '@/api/sources'
import { formatDisplay, getPath, type Resource } from '@/manifest'

const firstNames = ['Anna', 'Piotr', 'Maria', 'Tomasz', 'Ewa', 'James', 'Olivia', 'Lukas', 'Sofia', 'Noah', 'Zofia', 'Jan']
const lastNames = ['Kowalska', 'Nowak', 'Wiśniewska', 'Wójcik', 'Lewandowska', 'Smith', 'Brown', 'Müller', 'Rossi', 'Martin', 'Kamińska', 'Zieliński']
const cities: [string, string, string][] = [
  ['Warszawa', '00-001', 'PL'], ['Kraków', '30-001', 'PL'], ['Berlin', '10115', 'DE'], ['London', 'EC1A 1BB', 'GB'],
  ['Milano', '20121', 'IT'], ['Gdańsk', '80-001', 'PL'], ['Lyon', '69001', 'FR'],
]
const genders = ['FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'OTHER']
const stamp = '2026-09-14T09:30:00Z'

export const persons = Array.from({ length: 24 }, (_, i) => {
  const [city, postalCode, countryCode] = cities[i % cities.length]
  return {
    id: i + 1,
    version: 3,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[(i * 5 + Math.floor(i / 12)) % lastNames.length],
    email: `${firstNames[i % firstNames.length].toLowerCase()}.${i + 1}@example.com`,
    birthDate: `19${70 + ((i * 7) % 30)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    gender: genders[i % genders.length],
    status: i % 3 === 2 ? 'UNAVAILABLE' : 'AVAILABLE',
    availableFrom: i % 3 === 2 ? '2026-11-02' : undefined,
    availableTo: i % 3 === 2 ? '2026-11-20' : undefined,
    address: { street: `ul. Długa ${i + 3}`, postalCode, city, countryCode },
    createdAt: stamp,
    updatedAt: stamp,
  }
})

const taskTitles = [
  'Prepare the quarterly report', 'Renew the office lease', 'Review supplier contracts', 'Plan the team offsite',
  'Update the onboarding guide', 'Order new laptops', 'Audit access rights', 'Migrate the invoice archive',
  'Book the annual safety training', 'Clean up the customer list', 'Draft the hiring plan', 'Fix the printer queue',
]
const priorities = ['HIGH', 'MEDIUM', 'LOW']

export const tasks = Array.from({ length: 18 }, (_, i) => {
  const assignee = i % 5 === 4 ? undefined : persons[i % 6]
  return {
    id: i + 1,
    version: 1,
    title: taskTitles[i % taskTitles.length],
    description: i % 2 ? undefined : 'Collect the numbers from every department and send the summary to the board.',
    priority: priorities[i % priorities.length],
    done: i % 4 === 3,
    estimateHours: [1, 2.5, 4, 8, 0.5, 16][i % 6],
    dueDate: `2026-${String(10 + (i % 3)).padStart(2, '0')}-${String((i * 3) % 28 + 1).padStart(2, '0')}`,
    assignee: assignee && { id: assignee.id, label: `${assignee.firstName} ${assignee.lastName}` },
    createdAt: stamp,
    updatedAt: '2026-10-01T14:05:00Z',
  }
})

/** Deletes a sample record in place (the gallery list's row menu). */
export function removeRecord(records: { id: number }[], id: number) {
  const index = records.findIndex((record) => record.id === id)
  if (index >= 0) records.splice(index, 1)
}

/**
 * An in-memory list/get source for generic components that read another resource (related lists, relation
 * pickers): `q` matches the display name, other params filter by equality (`<x>Id` by the embedded `<x>.id`).
 */
export function memorySource(resource: Resource, records: object[]): ResourceSource {
  const all = records as ({ id: number } & object)[]
  return {
    listKey: (params) => ['gallery', resource.key, params],
    getKey: (id) => ['gallery', resource.key, id],
    get: async (id) => {
      const record = all.find((r) => r.id === id)
      if (!record) throw new Error(`No ${resource.key} ${id}`)
      return record
    },
    list: async ({ q, page = 0, size = 20, sort, ...filters }) => {
      const [field, direction] = String((sort as string[] | undefined)?.[0] ?? resource.list.defaultSort).split(',')
      const order = direction === 'desc' ? -1 : 1
      const value = (record: object) => {
        const v = getPath(record, field)
        return v && typeof v === 'object' && 'label' in v ? String(v.label) : (v ?? '')
      }
      const matches = all.filter(
        (record) =>
          (!q || formatDisplay(resource.display, record).toLowerCase().includes(String(q).toLowerCase())) &&
          Object.entries(filters).every(([param, value]) => {
            const path = param.endsWith('Id') ? `${param.slice(0, -2)}.id` : param
            return value === undefined || String(getPath(record, path)) === String(value)
          }),
      )
      matches.sort((a, b) => order * String(value(a)).localeCompare(String(value(b)), undefined, { numeric: true }))
      const start = Number(page) * Number(size)
      return {
        content: matches.slice(start, start + Number(size)),
        page: { totalElements: matches.length, totalPages: Math.ceil(matches.length / Number(size)) },
      }
    },
  }
}
