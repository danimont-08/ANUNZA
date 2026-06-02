import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

const PAGE_ROOTS = '.dashboard, .admin-root';
const EXIT_MS = 200;

export function usePageTransition() {
  const navigate = useNavigate();

  const go = useCallback((path, opts) => {
    const root = document.querySelector(PAGE_ROOTS);
    if (!root) {
      navigate(path, opts);
      return;
    }
    root.classList.add('page-exiting');
    setTimeout(() => navigate(path, opts), EXIT_MS);
  }, [navigate]);

  return go;
}
