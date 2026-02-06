export * from './user.enum';
export * from './coverage-type.enum';
export * from './auth.enum';
export * from './quote.enum';
export * from './carrier.enum';
export * from './policy.enum';
export * from './payment.enum';

export enum InsuranceType {
  COMMERCIAL = 'commercial',
  PERSONAL = 'personal',
}

export enum RequestType {
  NEW_BUSINESS = 'new_business',
  RENEWAL = 'renewal',
  QUOTE_ONLY = 'quote_only',
}
