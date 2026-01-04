import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

interface UseKeyboardShortcutsOptions {
  onShowShortcuts?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const navigate = useNavigate();
  const { role, setRole } = useUser();
  const { onShowShortcuts } = options;

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
        
        // First, check if search is collapsed and expand it
        const searchToggleButton = document.querySelector('[data-search-toggle="true"]') as HTMLButtonElement;
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        
        if (searchToggleButton && !searchInput) {
          // Search is collapsed, expand it first with smooth transition
          searchToggleButton.click();
          
          // Use requestAnimationFrame for smoother transition
          requestAnimationFrame(() => {
            // Wait for next frame to ensure DOM is updated
            setTimeout(() => {
              const expandedSearchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
              if (expandedSearchInput) {
                expandedSearchInput.focus();
                // Add a subtle highlight effect
                expandedSearchInput.classList.add('ring-2', 'ring-primary/20');
                setTimeout(() => {
                  expandedSearchInput.classList.remove('ring-2', 'ring-primary/20');
                }, 1000);
                // Move cursor to end if there's existing text
                const len = expandedSearchInput.value.length;
                expandedSearchInput.setSelectionRange(len, len);
              }
            }, 200); // Match the slide-in animation duration
          });
        } else if (searchInput) {
          // Search is already expanded, just focus it with highlight
          searchInput.focus();
          searchInput.classList.add('ring-2', 'ring-primary/20');
          setTimeout(() => {
            searchInput.classList.remove('ring-2', 'ring-primary/20');
          }, 1000);
          const len = searchInput.value.length;
          searchInput.setSelectionRange(len, len);
        }
      }

      // Cmd/Ctrl + /: Show keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        if (onShowShortcuts) {
          onShowShortcuts();
        }
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

      // Cmd/Ctrl + D: Go to analytics (Dashboard)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        navigate('/analytics');
      }

      // Escape: Clear all filters
      if (e.key === 'Escape') {
        const clearButton = document.querySelector('button:has-text("Clear all")') as HTMLButtonElement;
        clearButton?.click();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, role, setRole, onShowShortcuts]);
}