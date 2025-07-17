import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { role, setRole } = useUser();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Cmd/Ctrl + K: Focus search (if on assessments page)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // For now, we'll use console.log. In production, you'd use a proper modal
        console.log(`
🎹 Keyboard Shortcuts:

${e.metaKey ? 'Cmd' : 'Ctrl'} + K: Focus search
${e.metaKey ? 'Cmd' : 'Ctrl'} + R: Switch role
${e.metaKey ? 'Cmd' : 'Ctrl'} + H: Go home
${e.metaKey ? 'Cmd' : 'Ctrl'} + A: Go to assessments
Escape: Clear filters
        `);
      }

      // Cmd/Ctrl + R: Toggle role
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        setRole(role === 'mat-admin' ? 'department-head' : 'mat-admin');
      }

      // Cmd/Ctrl + H: Go home
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        navigate('/');
      }

      // Cmd/Ctrl + A: Go to assessments
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        navigate('/assessments');
      }

      // Escape: Clear all filters
      if (e.key === 'Escape') {
        const clearButton = document.querySelector('button:has-text("Clear all")') as HTMLButtonElement;
        clearButton?.click();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, role, setRole]);
}