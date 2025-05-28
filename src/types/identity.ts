export interface Identity {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
  attributes: IdentityAttributes;
}

export interface IdentityAttributes {
  // Basic Profile
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  isOver18?: boolean;
  nationality?: string;
  occupation?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  
  // Allow additional custom attributes
  [key: string]: any;
}