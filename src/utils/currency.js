export const getCurrencySymbol = (code) => {
  switch (code) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'PLN':
      return 'zł';
    case 'CZK':
      return 'Kč';
    default:
      return code || '';
  }
};

// Lista dostępnych walut:
export const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CZK'];
