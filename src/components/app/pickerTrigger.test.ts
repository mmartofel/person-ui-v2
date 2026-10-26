import { pickerTriggerClass } from './pickerTrigger'

describe('pickerTriggerClass', () => {
  it('looks like the other inputs: input border, transparent, no hover fill', () => {
    const classes = pickerTriggerClass(false).split(' ')
    expect(classes).toEqual(expect.arrayContaining(['border-input', 'bg-transparent', 'hover:bg-transparent']))
    expect(classes).not.toContain('text-muted-foreground')
  })

  it('mutes only a placeholder, not a chosen "Any"', () => {
    expect(pickerTriggerClass(true).split(' ')).toContain('text-muted-foreground')
    expect(pickerTriggerClass(false).split(' ')).not.toContain('text-muted-foreground')
  })
})
