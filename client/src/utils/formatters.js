export const formatPrice = (paise, currency = 'INR') => {
  if (paise === 0 || paise === '0') {
    return 'Free';
  }
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDuration = (startString, endString) => {
  if (!startString || !endString) return '';
  const start = new Date(startString);
  const end = new Date(endString);
  const diffHours = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;
  return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
};
