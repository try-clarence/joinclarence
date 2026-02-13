export enum PaymentType {
  INITIAL = 'initial',
  RECURRING = 'recurring',
  ENDORSEMENT = 'endorsement',
  ONE_TIME = 'one_time',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  ACH = 'ach',
  CHECK = 'check',
}
