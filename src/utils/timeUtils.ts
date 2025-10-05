export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'gerade eben';
  } else if (diffMins < 60) {
    return `vor ${diffMins} Minute${diffMins !== 1 ? 'n' : ''}`;
  } else if (diffHours < 24) {
    return `vor ${diffHours} Stunde${diffHours !== 1 ? 'n' : ''}`;
  } else if (diffDays < 7) {
    return `vor ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
  } else {
    return `am ${date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}`;
  }
};
