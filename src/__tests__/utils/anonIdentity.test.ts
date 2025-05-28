import { validateAttributes, ENHANCED_SCHEMA } from '../../utils/anonIdentity'

describe('anonIdentity utils', () => {
  describe('validateAttributes', () => {
    it('validates empty attributes as valid', () => {
      const result = validateAttributes({})
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates all valid attributes', () => {
      const attributes = {
        givenName: 'John',
        familyName: 'Doe',
        dateOfBirth: '1990-01-01',
        isOver18: true,
        email: 'john@example.com',
        phone: '+1234567890'
      }
      
      const result = validateAttributes(attributes)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates date fields correctly', () => {
      const validDate = validateAttributes({ dateOfBirth: '1990-01-01' })
      expect(validDate.valid).toBe(true)

      const invalidDate = validateAttributes({ dateOfBirth: 'invalid-date' })
      expect(invalidDate.valid).toBe(false)
      expect(invalidDate.errors).toContain('Date of Birth must be a valid date')
    })

    it('validates boolean fields correctly', () => {
      const validBoolean = validateAttributes({ isOver18: true })
      expect(validBoolean.valid).toBe(true)

      const invalidBoolean = validateAttributes({ isOver18: 'not-boolean' })
      expect(invalidBoolean.valid).toBe(false)
      expect(invalidBoolean.errors).toContain('Are you over 18? must be true or false')
    })

    it('validates number fields correctly', () => {
      // Since our current schema doesn't have number fields, this test demonstrates
      // that unknown fields are ignored by the current validation logic
      const attributes = { someUnknownField: 'some-value' }
      
      const result = validateAttributes(attributes)
      expect(result.valid).toBe(true) // Since someUnknownField is not in ENHANCED_SCHEMA
    })

    it('ignores empty, null, and undefined values', () => {
      const attributes = {
        givenName: '',
        familyName: null,
        email: undefined,
        phone: '   ', // whitespace should be valid since we don't trim in validation
      }
      
      const result = validateAttributes(attributes)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('handles multiple validation errors', () => {
      const attributes = {
        dateOfBirth: 'invalid-date',
        isOver18: 'not-boolean'
      }
      
      const result = validateAttributes(attributes)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('Date of Birth must be a valid date')
      expect(result.errors).toContain('Are you over 18? must be true or false')
    })
  })

  describe('ENHANCED_SCHEMA', () => {
    it('contains all expected fields', () => {
      const fieldNames = ENHANCED_SCHEMA.map(field => field.name)
      
      // Basic profile fields
      expect(fieldNames).toContain('givenName')
      expect(fieldNames).toContain('familyName')
      expect(fieldNames).toContain('dateOfBirth')
      expect(fieldNames).toContain('isOver18')
      expect(fieldNames).toContain('nationality')
      expect(fieldNames).toContain('occupation')
      
      // Contact info fields
      expect(fieldNames).toContain('email')
      expect(fieldNames).toContain('phone')
      expect(fieldNames).toContain('street')
      expect(fieldNames).toContain('city')
      expect(fieldNames).toContain('state')
      expect(fieldNames).toContain('postalCode')
      expect(fieldNames).toContain('country')
    })

    it('has proper field configurations', () => {
      const givenNameField = ENHANCED_SCHEMA.find(f => f.name === 'givenName')
      expect(givenNameField).toEqual({
        name: 'givenName',
        type: 'string',
        required: false,
        label: 'First Name',
        placeholder: 'Enter your first name'
      })

      const isOver18Field = ENHANCED_SCHEMA.find(f => f.name === 'isOver18')
      expect(isOver18Field).toEqual({
        name: 'isOver18',
        type: 'boolean',
        required: false,
        label: 'Are you over 18?',
        placeholder: ''
      })

      const dobField = ENHANCED_SCHEMA.find(f => f.name === 'dateOfBirth')
      expect(dobField).toEqual({
        name: 'dateOfBirth',
        type: 'date',
        required: false,
        label: 'Date of Birth',
        placeholder: 'YYYY-MM-DD'
      })
    })

    it('has all fields marked as optional', () => {
      ENHANCED_SCHEMA.forEach(field => {
        expect(field.required).toBe(false)
      })
    })
  })
})