type Theme = 'dark' | 'light';

const STORAGE_KEY = 'jessie-portfolio-theme';

function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light';
}

function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : 'dark';
  } catch {
    return 'dark';
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
      theme === 'dark' ? 'Switch to Matcha Cream light theme' : 'Switch to dark theme',
    );
    button.title = theme === 'dark' ? 'Matcha Cream light mode' : 'Dark mode';
    label.textContent = theme;
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
