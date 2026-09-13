export const CATEGORIES_BY_TYPE = {
  expense: ['food', 'shopping', 'travel', 'entertainment', 'utilities', 'medical', 'fuel', 'online_purchase', 'other'],
  upi_expense: ['food', 'shopping', 'travel', 'entertainment', 'utilities', 'medical', 'fuel', 'online_purchase', 'other'],
  income: ['salary', 'other'],
  refund: ['shopping', 'online_purchase', 'travel', 'other'],
  bank_transfer: ['other'],
};

export const PAYMENT_METHODS_BY_TYPE = {
  expense: ['cash', 'upi', 'debit_card', 'net_banking', 'other'],
  upi_expense: ['upi'],
  income: ['bank_transfer', 'neft', 'rtgs', 'cheque', 'other'],
  refund: ['bank_transfer', 'upi', 'other'],
  bank_transfer: ['neft', 'rtgs', 'imps', 'other'],
};

export const getCategoriesForType = (type) => CATEGORIES_BY_TYPE[type] || ['other'];
export const getPaymentMethodsForType = (type) => PAYMENT_METHODS_BY_TYPE[type] || ['other'];