import { initials } from './initials'

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Person UI')).toBe('PU')
    expect(initials('anna maria kowalska')).toBe('AM')
  })

  it('handles one word, extra spaces, non-ASCII letters and an empty name', () => {
    expect(initials('Orders')).toBe('O')
    expect(initials('  Łukasz   Żak ')).toBe('ŁŻ')
    expect(initials('')).toBe('')
  })
})
