// Import anon-identity browser components
import type { AttributeSchema } from 'anon-identity/browser';

// Create our own schemas based on the anon-identity structure
export const BASIC_PROFILE_SCHEMA: AttributeSchema[] = [
  { name: 'givenName', type: 'string', required: false },
  { name: 'familyName', type: 'string', required: false },
  { name: 'dateOfBirth', type: 'date', required: false },
  { name: 'isOver18', type: 'boolean', required: false },
  { name: 'nationality', type: 'string', required: false },
  { name: 'occupation', type: 'string', required: false }
];

export const CONTACT_INFO_SCHEMA: AttributeSchema[] = [
  { name: 'email', type: 'string', required: false },
  { name: 'phone', type: 'string', required: false },
  { name: 'street', type: 'string', required: false },
  { name: 'city', type: 'string', required: false },
  { name: 'state', type: 'string', required: false },
  { name: 'postalCode', type: 'string', required: false },
  { name: 'country', type: 'string', required: false }
];

// Combine all schemas
export const ALL_SCHEMAS = [...BASIC_PROFILE_SCHEMA, ...CONTACT_INFO_SCHEMA];

export interface SchemaField {
  name: string;
  type: 'string' | 'date' | 'boolean' | 'number' | 'object';
  required?: boolean;
  label?: string;
  placeholder?: string;
}

// Enhanced schema with UI labels and placeholders
export const ENHANCED_SCHEMA: SchemaField[] = [
  { name: 'givenName', type: 'string', required: false, label: 'First Name', placeholder: 'Enter your first name' },
  { name: 'familyName', type: 'string', required: false, label: 'Last Name', placeholder: 'Enter your last name' },
  { name: 'dateOfBirth', type: 'date', required: false, label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
  { name: 'isOver18', type: 'boolean', required: false, label: 'Are you over 18?', placeholder: '' },
  { name: 'nationality', type: 'string', required: false, label: 'Nationality', placeholder: 'e.g., American, British' },
  { name: 'occupation', type: 'string', required: false, label: 'Occupation', placeholder: 'Enter your job title' },
  { name: 'email', type: 'string', required: false, label: 'Email Address', placeholder: 'your@email.com' },
  { name: 'phone', type: 'string', required: false, label: 'Phone Number', placeholder: '+1234567890' },
  { name: 'street', type: 'string', required: false, label: 'Street Address', placeholder: '123 Main St' },
  { name: 'city', type: 'string', required: false, label: 'City', placeholder: 'Your city' },
  { name: 'state', type: 'string', required: false, label: 'State/Province', placeholder: 'Your state' },
  { name: 'postalCode', type: 'string', required: false, label: 'Postal Code', placeholder: '12345' },
  { name: 'country', type: 'string', required: false, label: 'Country', placeholder: 'Your country' }
];

export const validateAttributes = (attributes: Record<string, any>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Simple validation for required fields
  ENHANCED_SCHEMA.forEach(field => {
    if (field.required && (!attributes[field.name] || attributes[field.name].toString().trim() === '')) {
      errors.push(`${field.label || field.name} is required`);
    }
    
    // Type validation
    if (attributes[field.name] !== undefined && attributes[field.name] !== null && attributes[field.name] !== '') {
      if (field.type === 'date') {
        const dateValue = new Date(attributes[field.name]);
        if (isNaN(dateValue.getTime())) {
          errors.push(`${field.label || field.name} must be a valid date`);
        }
      } else if (field.type === 'boolean') {
        if (typeof attributes[field.name] !== 'boolean') {
          errors.push(`${field.label || field.name} must be true or false`);
        }
      } else if (field.type === 'number') {
        if (isNaN(Number(attributes[field.name]))) {
          errors.push(`${field.label || field.name} must be a number`);
        }
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};