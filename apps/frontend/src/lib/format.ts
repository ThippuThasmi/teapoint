/** Prices are stored in minor units (paise). */
export function formatPrice(minor: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(minor / 100);
}
