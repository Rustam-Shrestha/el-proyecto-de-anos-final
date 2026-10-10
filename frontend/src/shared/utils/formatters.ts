export const formatters = {
  currency: (amount: number, currencySymbol = '₹') => {
    if (amount === undefined || amount === null || isNaN(amount)) return `${currencySymbol}0`;
    return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
  },

  phone: (phoneStr: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/(\+\d{3})(\d{5})(\d{5})/, '$1 $2 $3');
  },

  pan: (panStr: string) => {
    if (!panStr) return '';
    return panStr.toUpperCase().replace(/([A-Z]{4})([0-9]{4})([A-Z]{1})/, '$1 $2$3');
  },

  date: (dateVal: string | Date) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  datetime: (dateVal: string | Date) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  },

  percentage: (decimalVal: number) => {
    if (decimalVal === undefined || decimalVal === null || isNaN(decimalVal)) return '0%';
    const pct = decimalVal > 1 ? decimalVal : decimalVal * 100;
    return `${Math.round(pct)}%`;
  },
};

export default formatters;
