import Script from "next/script";

export const THEME_STORAGE_KEY = "cm_theme";

export function ThemeScript() {
  // Runs before hydration to avoid flash.
  const code = `(() => {
  try {
    const key = "${THEME_STORAGE_KEY}";
    const stored = localStorage.getItem(key);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = stored === 'dark' || (stored !== 'light' && stored !== 'dark' && prefersDark);
    const root = document.documentElement;
    if (shouldDark) root.classList.add('dark');
    else root.classList.remove('dark');
  } catch (_) {}
})();`;

  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
