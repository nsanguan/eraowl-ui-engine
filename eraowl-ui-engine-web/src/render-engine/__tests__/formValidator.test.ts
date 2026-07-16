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

  it('returns error for min violation (number)', () => {
    const layout = makeLayout([
      { id: 'age', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { min: 18 } },
    ])
    const result = formValidator(layout, { age: 10 })
    expect(result.valid).toBe(false)
    expect(result.errors.age).toContain('Minimum value is 18')
  })

  it('returns valid for min satisfied (number)', () => {
    const layout = makeLayout([
      { id: 'age', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { min: 18 } },
    ])
    const result = formValidator(layout, { age: 21 })
    expect(result.valid).toBe(true)
  })

  it('returns error for max violation (number)', () => {
    const layout = makeLayout([
      { id: 'age', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { max: 65 } },
    ])
    const result = formValidator(layout, { age: 70 })
    expect(result.valid).toBe(false)
    expect(result.errors.age).toContain('Maximum value is 65')
  })

  it('treats an invalid regex pattern as no-match (no throw)', () => {
    const layout = makeLayout([
      { id: 'code', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { pattern: '([' } },
    ])
    const result = formValidator(layout, { code: 'abc' })
    expect(result.valid).toBe(false)
    expect(result.errors.code).toContain('Invalid format')
  })

  it('treats an oversized regex pattern as no-match', () => {
    const layout = makeLayout([
      { id: 'code', type: 'Region' as Component['type'], position: { x: 0, y: 0, width: 100, height: 40 }, validation: { pattern: 'a'.repeat(201) } },
    ])
    const result = formValidator(layout, { code: 'abc' })
    expect(result.valid).toBe(false)
    expect(result.errors.code).toContain('Invalid format')
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

  it('validates nested components inside containers recursively', () => {
    const layout = ({
      schemaVersion: '1.0.0',
      regions: [{
        id: 'r1',
        title: 'Form',
        components: [
          {
            id: 'gridRow',
            type: 'GridRow' as Component['type'],
            position: { x: 0, y: 0, width: 800, height: 60 },
            components: [
              {
                id: 'gridCol',
                type: 'GridColumn' as Component['type'],
                position: { x: 0, y: 0, width: 400, height: 60 },
                components: [
                  {
                    id: 'nestedField',
                    type: 'InputText' as Component['type'],
                    position: { x: 0, y: 0, width: 200, height: 40 },
                    validation: { required: true },
                  },
                ],
              },
            ],
          },
        ],
      }],
    }) as unknown as LayoutJson

    // Nested required field is empty → should fail
    const result = formValidator(layout, { nestedField: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.nestedField).toContain('This field is required')
  })

  it('validates nested component passes when value is present', () => {
    const layout = ({
      schemaVersion: '1.0.0',
      regions: [{
        id: 'r1',
        title: 'Form',
        components: [
          {
            id: 'gridRow',
            type: 'GridRow' as Component['type'],
            position: { x: 0, y: 0, width: 800, height: 60 },
            components: [
              {
                id: 'gridCol',
                type: 'GridColumn' as Component['type'],
                position: { x: 0, y: 0, width: 400, height: 60 },
                components: [
                  {
                    id: 'nestedField',
                    type: 'InputText' as Component['type'],
                    position: { x: 0, y: 0, width: 200, height: 40 },
                    validation: { required: true },
                  },
                ],
              },
            ],
          },
        ],
      }],
    }) as unknown as LayoutJson

    const result = formValidator(layout, { nestedField: 'has value' })
    expect(result.valid).toBe(true)
  })
})
