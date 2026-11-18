export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    'xxxxxxxx-xxxx-4xxx-yxxx-' + 'xxxxxxxxxxxx'.replace(/x/g, () => {
      return Math.random((Math.random() * 16) | 0).toString(16);
    })
  );
}