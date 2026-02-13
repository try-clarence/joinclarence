export enum PolicyStatus {
  BOUND = 'bound',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING_CANCELLATION = 'pending_cancellation',
}

export enum PaymentPlan {
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export enum PolicyActivityType {
  CREATED = 'created',
  RENEWED = 'renewed',
  MODIFIED = 'modified',
  PAYMENT = 'payment',
  DOCUMENT_UPLOADED = 'document_uploaded',
  CANCELLED = 'cancelled',
}

export enum PolicyDocumentType {
  POLICY_DOCUMENT = 'policy_document',
  CERTIFICATE = 'certificate',
  INVOICE = 'invoice',
  ENDORSEMENT = 'endorsement',
  DECLARATION = 'declaration',
}
