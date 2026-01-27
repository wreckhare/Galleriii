/**
 * Creates a debounced version of a function that delays execution
 * until after `wait` milliseconds have elapsed since the last call.
 *
 * @param func - The function to debounce
 * @param wait - Milliseconds to delay
 * @returns Debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
