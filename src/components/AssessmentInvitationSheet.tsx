import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, ChevronDown, ChevronRight, School as SchoolIcon, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { mockSchools } from "@/lib/mock-data";
import type { AssessmentCategory } from "@/types/assessment";

type AssessmentInvitationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssessmentInvitationSheet({ open, onOpenChange }: AssessmentInvitationSheetProps) {
  const [category, setCategory] = useState<AssessmentCategory | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [isSelectAllOpen, setIsSelectAllOpen] = useState(false);
  
  // Filter schools based on the search term
  const filteredSchools = mockSchools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle school selection
  const toggleSchool = (schoolId: string) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  // Toggle all schools
  const toggleAllSchools = () => {
    if (selectedSchools.length === mockSchools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(mockSchools.map(school => school.id));
    }
  };

  // Handle invitation send
  const handleSendInvitations = () => {
    // In a real app, you would send API requests here
    console.log("Invitations sent to:", {
      category,
      schools: selectedSchools.map(id => mockSchools.find(s => s.id === id)?.name),
      dueDate: dueDate ? format(dueDate, "PPP") : "No deadline",
    });
    
    // Close the sheet and reset form
    onOpenChange(false);
    setCategory("");
    setSelectedSchools([]);
    setDueDate(undefined);
    setSearchTerm("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full sm:max-w-md">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-xl">Request Assessment</SheetTitle>
          <SheetDescription>
            Invite schools to complete a specific assessment category.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Assessment Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Assessment Category
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as AssessmentCategory)}>
              <SelectTrigger id="category" className={cn(
                "w-full", 
                !category && "text-muted-foreground"
              )}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Human Resources">Human Resources</SelectItem>
                <SelectItem value="Finance & Procurement">Finance & Procurement</SelectItem>
                <SelectItem value="Estates">Estates</SelectItem>
                <SelectItem value="Governance">Governance</SelectItem>
                <SelectItem value="IT & Information Services">IT & Information Services</SelectItem>
                <SelectItem value="IT (Strategy & Support)">IT (Strategy & Support)</SelectItem>
              </SelectContent>
            </Select>
            {category && (
              <p className="text-xs text-muted-foreground mt-1">
                {category === "Education" && "Quality of education, behavior, leadership & management, etc."}
                {category === "Human Resources" && "Recruitment, absence management, staff retention, etc."}
                {category === "Finance & Procurement" && "Financial governance, planning, monitoring, etc."}
                {category === "Estates" && "Health & safety, estate management, asset planning, etc."}
                {category === "Governance" && "Strategic leadership, accountability, governance structures, etc."}
                {category === "IT & Information Services" && "Data security, breach management, GDPR compliance, etc."}
                {category === "IT (Strategy & Support)" && "IT strategy, service management, asset management, etc."}
              </p>
            )}
          </div>
          
          {/* Due Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className="border-0 rounded-md"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              {dueDate 
                ? `Schools will have until ${format(dueDate, "PPPP")} to complete this assessment.` 
                : "Setting a due date is optional but recommended for timely completions."}
            </p>
          </div>
          
          {/* School Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="schools" className="text-sm font-medium">
                Select Schools
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 gap-1 text-xs font-normal"
                onClick={() => setIsSelectAllOpen(!isSelectAllOpen)}
              >
                {isSelectAllOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                Quick options
              </Button>
            </div>
            
            {isSelectAllOpen && (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-md">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="selectAll" 
                    checked={selectedSchools.length === mockSchools.length}
                    onCheckedChange={toggleAllSchools}
                  />
                  <Label htmlFor="selectAll" className="text-xs font-medium cursor-pointer">
                    Select all schools
                  </Label>
                </div>
                <Badge variant="outline" className="font-normal">
                  {mockSchools.length} schools
                </Badge>
              </div>
            )}
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="schools"
                placeholder="Search schools..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md h-[180px] overflow-y-auto">
              {filteredSchools.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
                  <p>No schools found</p>
                </div>
              ) : (
                filteredSchools.map((school) => (
                  <div 
                    key={school.id} 
                    className={cn(
                      "flex items-center px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b last:border-b-0",
                      selectedSchools.includes(school.id) && "bg-slate-50"
                    )}
                    onClick={() => toggleSchool(school.id)}
                  >
                    <Checkbox 
                      id={`school-${school.id}`}
                      checked={selectedSchools.includes(school.id)}
                      className="mr-3 h-4 w-4"
                      onCheckedChange={() => toggleSchool(school.id)}
                    />
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100">
                        <SchoolIcon className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      <span className="text-sm truncate">{school.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {selectedSchools.length} of {mockSchools.length} schools selected
            </p>
          </div>
        </div>
        
        <div className="border-t mt-auto pt-4 pb-2 flex-shrink-0">
          {(category && selectedSchools.length > 0) && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md mb-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-700">Ready to send</p>
                  <p className="text-xs text-blue-600">
                    Requesting {selectedSchools.length} {selectedSchools.length === 1 ? 'school' : 'schools'} to complete the <span className="font-medium">{category}</span> assessment
                    {dueDate ? ` by ${format(dueDate, "PPP")}` : ''}.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvitations}
              disabled={!category || selectedSchools.length === 0}
              className="gap-2 flex-1"
            >
              <Send className="h-4 w-4" />
              Request
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 