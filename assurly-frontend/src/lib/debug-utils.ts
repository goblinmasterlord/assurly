// Debug utilities for development
export function debugLocalStorage() {
  if (typeof window === 'undefined') return;
  
  console.log('=== LocalStorage Debug ===');
  console.log('All keys:', Object.keys(localStorage));
  
  // Check role specifically
  const role = localStorage.getItem('assurly_user_role');
  console.log('Current role in storage:', role);
  console.log('Role type:', typeof role);
  console.log('Role length:', role?.length);
  
  // Check for any hidden characters
  if (role) {
    console.log('Role char codes:', Array.from(role).map(c => c.charCodeAt(0)));
  }
}

// Clear all app-related localStorage
export function clearAppStorage() {
  if (typeof window === 'undefined') return;
  
  const appKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('assurly_')
  );
  
  console.log('Clearing app storage keys:', appKeys);
  appKeys.forEach(key => localStorage.removeItem(key));
  console.log('Storage cleared');
}

// Fix corrupted role value
export function fixCorruptedRole() {
  if (typeof window === 'undefined') return;
  
  const role = localStorage.getItem('assurly_user_role');
  if (role && role !== 'mat-admin' && role !== 'department-head') {
    console.log('Found corrupted role:', role, 'Fixing...');
    localStorage.removeItem('assurly_user_role');
  }
}

// Add to window for easy console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugStorage = debugLocalStorage;
  (window as any).clearAppStorage = clearAppStorage;
  (window as any).fixCorruptedRole = fixCorruptedRole;
}