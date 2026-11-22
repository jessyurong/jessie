type Theme = 'dark' | 'light';

const STORAGE_KEY = 'jessie-portfolio-theme';

function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light';
}

function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : 'light';
  } catch {
    return 'light';
  }
}

export function initTheme(): void {
  const button = document.querySelector<HTMLButtonElement>('#themeToggle');
  const label = document.querySelector<HTMLElement>('#themeLabel');
  if (!button || !label) return;

  let theme = storedTheme();

  const apply = (): void => {
    document.documentElement.dataset.theme = theme;
    button.setAttribute('aria-pressed', String(theme === 'light'));
    button.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to day sky theme' : 'Switch to night sky theme',
    );
    button.title = theme === 'dark' ? 'Switch to day sky' : 'Switch to night sky';
    label.textContent = theme === 'light' ? 'day sky' : 'night sky';
  };

  apply();

  button.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage is optional */
    }
  });
}
