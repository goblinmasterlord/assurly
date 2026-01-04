import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Define user roles
export type UserRole = "mat-admin" | "department-head";

// Context type
type UserContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
};

// Create context with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  // Use the robust localStorage hook
  const [role, setRole, isLoading] = useLocalStorage<UserRole>(
    "assurly_user_role",
    "mat-admin",
    {
      // Simple string storage for role
      serialize: (value) => value,
      deserialize: (value) => {
        // Validate the role
        if (value === "department-head" || value === "mat-admin") {
          return value;
        }
        return "mat-admin";
      }
    }
  );

  return (
    <UserContext.Provider value={{ role, setRole, isLoading }}>
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

// Hook that waits for role to be loaded
export function useUserRole() {
  const { role, setRole, isLoading } = useUser();
  return {
    role: isLoading ? "mat-admin" : role, // Provide default while loading
    setRole,
    isLoading
  };
} 