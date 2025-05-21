import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, type UserRole } from "@/contexts/UserContext";
import { Building2, User2 } from "lucide-react";
import type { ReactNode } from "react";

export function RoleSwitcher() {
  const { role, setRole } = useUser();

  const roles: { value: UserRole; label: string; icon: ReactNode }[] = [
    {
      value: "mat-admin",
      label: "MAT Administrator",
      icon: <Building2 className="mr-2 h-4 w-4" />,
    },
    {
      value: "department-head",
      label: "School Dept. Head",
      icon: <User2 className="mr-2 h-4 w-4" />,
    },
  ];

  const activeRole = roles.find((r) => r.value === role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {activeRole?.icon}
          {activeRole?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          {roles.map((r) => (
            <DropdownMenuItem
              key={r.value}
              onClick={() => setRole(r.value)}
              className="cursor-pointer"
            >
              <div className="flex items-center">
                {r.icon}
                <span>{r.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 