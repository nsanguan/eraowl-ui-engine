import { describe, it, expect } from 'vitest'
import { formValidator } from '../validation/formValidator'
import type { LayoutJson, Component } from '../types'

const makeLayout = (components: Component[]) =>
  ({
    schemaVersion: '1.0.0',
    regions: [{ id: 'r1', title: 'Test', components }],
  }) as unknown as LayoutJson

describe('formValidator', () => {
  it('returns valid for layout with no validation rules', () => {
    const layout = makeLayout([
      { id: 'field1', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 } },
    ])
    const result = formValidator(layout, {})
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('returns error for required field with empty value', () => {
    const layout = makeLayout([
      { id: 'name', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { required: true } },
    ])
    const result = formValidator(layout, { name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toContain('This field is required')
  })

  it('returns valid for required field with value', () => {
    const layout = makeLayout([
      { id: 'name', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { required: true } },
    ])
    const result = formValidator(layout, { name: 'John' })
    expect(result.valid).toBe(true)
  })

  it('returns error for minLength violation', () => {
    const layout = makeLayout([
      { id: 'username', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { minLength: 3 } },
    ])
    const result = formValidator(layout, { username: 'ab' })
    expect(result.valid).toBe(false)
    expect(result.errors.username).toContain('Minimum length is 3')
  })

  it('returns error for maxLength violation', () => {
    const layout = makeLayout([
      { id: 'bio', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { maxLength: 5 } },
    ])
    const result = formValidator(layout, { bio: 'toolong' })
    expect(result.valid).toBe(false)
    expect(result.errors.bio).toContain('Maximum length is 5')
  })

  it('returns error for pattern mismatch', () => {
    const layout = makeLayout([
      { id: 'email', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$' } },
    ])
    const result = formValidator(layout, { email: 'not-an-email' })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toContain('Invalid format')
  })

  it('returns valid for pattern match', () => {
    const layout = makeLayout([
      { id: 'email', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$' } },
    ])
    const result = formValidator(layout, { email: 'test@example.com' })
    expect(result.valid).toBe(true)
  })

  it('reports errors for multiple fields', () => {
    const layout = makeLayout([
      { id: 'field1', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { required: true } },
      { id: 'field2', type: 'Region' as Component['type'], position: { x: 0, y: 40, width: 100, height: 40 }, validation: { required: true } },
    ])
    const result = formValidator(layout, {})
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors)).toHaveLength(2)
  })
})
