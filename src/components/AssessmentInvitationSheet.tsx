import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, ChevronDown, ChevronRight, School as SchoolIcon, Search, Send, ChevronLeft, Loader2 } from "lucide-react";
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
import { assessmentCategories } from "@/lib/mock-data";
import { getSchools, createAssessments } from "@/services/assessment-service";
import { useToast } from "@/hooks/use-toast";
import type { AssessmentCategory } from "@/types/assessment";

type AssessmentInvitationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Callback to refresh assessments list
};

// School type for the API response
interface School {
  id: string;
  name: string;
  code: string;
}

// Simple calendar component without relying on external dependencies
const SimpleDatePicker = ({ 
  selected, 
  onSelect 
}: { 
  selected?: Date; 
  onSelect: (date: Date) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get current date for "today" highlighting
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthNum = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get details for the displayed month
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();
  const monthName = format(currentMonth, "MMMM yyyy");
  
  // Calculate the first day of the month
  const firstDay = new Date(year, month, 1);
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the number of days in the month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Generate days of the week
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  // Generate calendar grid
  const days = [];
  
  // Previous month's days
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  // Go to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };
  
  // Check if a date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Is the date the currently selected one?
  const isSelected = (date: Date) => {
    if (!selected) return false;
    return date.getDate() === selected.getDate() && 
           date.getMonth() === selected.getMonth() && 
           date.getFullYear() === selected.getFullYear();
  };
  
  return (
    <div className="p-3 bg-white">
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={prevMonth}
          className="p-1 rounded-md hover:bg-slate-100"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium">{monthName}</h2>
        <button 
          onClick={nextMonth}
          className="p-1 rounded-md hover:bg-slate-100"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 mb-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center py-1 text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-9"></div>;
          }
          
          const isDisabled = isPastDate(day);
          const isToday = day.getDate() === currentDay && 
                          day.getMonth() === currentMonthNum && 
                          day.getFullYear() === currentYear;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                if (!isDisabled) {
                  onSelect(day);
                }
              }}
              disabled={isDisabled}
              className={cn(
                "h-9 w-9 rounded-md flex items-center justify-center text-sm",
                isDisabled ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100",
                isSelected(day) ? "bg-primary text-primary-foreground hover:bg-primary" : "",
                isToday && !isSelected(day) ? "border border-primary text-primary" : ""
              )}
              type="button"
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export function AssessmentInvitationSheet({ open, onOpenChange, onSuccess }: AssessmentInvitationSheetProps) {
  const [category, setCategory] = useState<AssessmentCategory | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [isSelectAllOpen, setIsSelectAllOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch schools when component mounts
  useEffect(() => {
    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        const schoolsData = await getSchools();
        setSchools(schoolsData);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        toast({
          title: "Error loading schools",
          description: "Failed to load schools. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSchoolsLoading(false);
      }
    };

    if (open) {
      fetchSchools();
    }
  }, [open, toast]);
  
  // Filter schools based on the search term
  const filteredSchools = schools.filter(school => 
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
    if (selectedSchools.length === schools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(schools.map(school => school.id));
    }
  };

  // Handle invitation send
  const handleSendInvitations = async () => {
    if (!category || selectedSchools.length === 0) return;

    setLoading(true);

    try {
      const success = await createAssessments({
        category,
        schoolIds: selectedSchools,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
        term: "Summer", // Could be made dynamic
        academicYear: "2024-2025" // Could be made dynamic
      });

      if (success) {
        toast({
          title: "Assessments created successfully!",
          description: `Successfully created ${category} assessments for ${selectedSchools.length} ${selectedSchools.length === 1 ? 'school' : 'schools'}.`,
        });

        onSuccess?.();
        onOpenChange(false);
        setCategory("");
        setSelectedSchools([]);
        setDueDate(undefined);
        setSearchTerm("");
      } else {
        // Assessment creation is not available in backend yet
        toast({
          title: "Assessment creation not available",
          description: "The backend doesn't support assessment creation yet. This feature is coming soon.",
          variant: "default", // Use default instead of destructive since it's not an error
        });
        
        // Still close the dialog and reset form for better UX
        onOpenChange(false);
        setCategory("");
        setSelectedSchools([]);
        setDueDate(undefined);
        setSearchTerm("");
      }
    } catch (error) {
      console.error('Error in assessment creation:', error);
      toast({
        title: "Error creating assessments",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                {assessmentCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category && (
              <p className="text-xs text-muted-foreground mt-1">
                {assessmentCategories.find(cat => cat.value === category)?.description}
              </p>
            )}
          </div>
          
          {/* Due Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
              <PopoverContent align="start" className="p-0 w-auto">
                <div className="border-b p-3">
                  <div className="text-sm font-medium">Select date</div>
                  <div className="text-xs text-muted-foreground">
                    Choose when schools need to complete this assessment
                  </div>
                </div>
                <SimpleDatePicker
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDatePickerOpen(false);
                  }}
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
                    checked={selectedSchools.length === schools.length}
                    onCheckedChange={toggleAllSchools}
                  />
                  <Label htmlFor="selectAll" className="text-xs font-medium cursor-pointer">
                    Select all schools
                  </Label>
                </div>
                <Badge variant="outline" className="font-normal">
                  {schools.length} schools
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
            
            <div className="border rounded-md h-[240px] overflow-y-auto">
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
              {selectedSchools.length} of {schools.length} schools selected
            </p>
          </div>
        </div>
        
        <div className="border-t mt-auto pt-6 pb-4 flex-shrink-0">
          {(category && selectedSchools.length > 0) && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-blue-700">Ready to send</p>
                  <p className="text-sm text-blue-600">
                    Requesting {selectedSchools.length} {selectedSchools.length === 1 ? 'school' : 'schools'} to complete the {category} assessment
                    {dueDate ? ` by ${format(dueDate, "PPP")}` : ''}.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 gap-2"
              disabled={!category || selectedSchools.length === 0 || loading}
              onClick={handleSendInvitations}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Request Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 