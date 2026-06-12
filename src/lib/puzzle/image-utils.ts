/**
 * Securely preloads an image URL, returning a Promise that resolves when fully loaded,
 * preventing rendering delays and layout shifts.
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
}
