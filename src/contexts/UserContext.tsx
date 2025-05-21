import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Define user roles
export type UserRole = "mat-admin" | "department-head";

// Context type
type UserContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

// Create context with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("mat-admin");

  return (
    <UserContext.Provider value={{ role, setRole }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for using the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
} 