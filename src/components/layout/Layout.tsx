import { type ReactNode, useEffect, useState } from 'react';
import { NavBar } from './NavBar';
import { useThemeStore } from '@/store/theme.store';
import { Toaster } from 'sonner';
import { Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useThemeStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsLoaded(true);
  }, [theme]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background text-text flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Cargando aplicación"
        >
          <span className="sr-only">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-background text-text transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}
    >
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <header className="p-4 flex justify-between items-center border-b border-border bg-surface sticky top-0 z-10" role="banner">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
            <span className="text-white font-bold text-lg">E+</span>
          </div>
          <h1 className="text-xl font-bold text-text">Emprende+</h1>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-surface border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-200"
          aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
          <span className="sr-only">{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
        </button>
      </header>

      <main id="main-content" className="pb-80 md:pb-4 pt-4" role="main">{children}</main>

      <NavBar />

      <Toaster
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </div>
  );
}