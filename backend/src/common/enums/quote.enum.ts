export enum CarrierQuoteStatus {
  QUOTED = 'quoted',
  DECLINED = 'declined',
  REFERRED = 'referred',
  EXPIRED = 'expired',
}

export enum QuoteRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  QUOTES_READY = 'quotes_ready',
  QUOTE_SELECTED = 'quote_selected',
  PURCHASED = 'purchased',
  EXPIRED = 'expired',
}

export enum AddressType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
}

export enum InsuranceOptionStatus {
  AVAILABLE = 'available',
  PURCHASED = 'purchased',
  EXPIRED = 'expired',
  DECLINED = 'declined',
}
