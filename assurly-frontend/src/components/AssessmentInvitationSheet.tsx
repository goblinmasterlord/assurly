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
import { getAspectDisplayName } from "@/lib/assessment-utils";
import { useAuth } from "@/contexts/AuthContext";
import type { AssessmentCategory, School, AcademicTerm, AcademicYear } from "@/types/assessment";

type AssessmentInvitationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Callback to refresh assessments list
};

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
  const [selectedCategories, setSelectedCategories] = useState<AssessmentCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [term, setTerm] = useState<AcademicTerm>("Autumn");
  const [academicYear, setAcademicYear] = useState<AcademicYear>("");
  
  // Determine default term and academic year based on current date
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth(); // 0 Jan ... 11 Dec
    let defaultTerm: string;
    if (month >= 8) {
      defaultTerm = "Autumn";
    } else if (month >= 4) {
      defaultTerm = "Summer";
    } else {
      defaultTerm = "Spring";
    }
    const year = now.getFullYear();
    const startYear = month >= 8 ? year : year - 1;
    const endYearShort = (startYear + 1).toString().slice(-2);
    const defaultAcademicYear = `${startYear}-${endYearShort}`;
    setTerm(defaultTerm as AcademicTerm);
    setAcademicYear(defaultAcademicYear);
  }, []);

  const termOptions = ["Autumn", "Spring", "Summer"];
  // Generate a list of the current and next 2 academic years for convenience
  const academicYearOptions = Array.from({ length: 3 }, (_, idx) => {
    const start = new Date().getFullYear() + idx - 1; // start with previous/current depending on month
    const endShort = (start + 1).toString().slice(-2);
    return `${start}-${endShort}`;
  });
  
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
    (school.name || school.school_name).toLowerCase().includes(searchTerm.toLowerCase())
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
      setSelectedSchools(schools.map(school => school.id || school.school_id));
    }
  };

  // Toggle all categories
  const toggleAllCategories = () => {
    if (selectedCategories.length === assessmentCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(assessmentCategories.map(cat => cat.value));
    }
  };

  // Handle invitation send
  const handleSendInvitations = async () => {
    if (selectedCategories.length === 0 || selectedSchools.length === 0) return;

    setLoading(true);

    try {
      let totalAssessments = 0;
      
      // Create assessments for each selected category
      for (const category of selectedCategories) {
        await createAssessments({
          school_ids: selectedSchools,
          aspect_code: category,
          term_id: `${term}-${academicYear}`,
          due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
          assigned_to: user?.user_id || user?.id,
        });
        totalAssessments += selectedSchools.length;
      }

      // Show success toast immediately
      toast({
        title: "✅ Ratings created successfully!",
        description: `Successfully created ${totalAssessments} assessment(s) across ${selectedCategories.length} aspect(s).`,
        duration: 5000, // Show for 5 seconds
      });

      // Trigger refresh immediately
      if (onSuccess) {
        await onSuccess();
      }
      
      // Close the sheet and reset form
      onOpenChange(false);
      setSelectedCategories([]);
      setSelectedSchools([]);
      setDueDate(undefined);
      setSearchTerm("");
    } catch (error) {
      console.error('Error in assessment creation:', error);
      toast({
        title: "Error creating ratings",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full sm:max-w-lg">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-xl">Request Rating</SheetTitle>
          <SheetDescription>
            Invite schools to complete assessments for one or more aspects. You can select multiple aspects and schools at once.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* School Selection - Moved to top */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Select Schools
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which schools will receive the assessment request
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Quick select options */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={toggleAllSchools}
              >
                {selectedSchools.length === schools.length ? 'Deselect all' : 'Select all'} ({schools.length})
              </Button>
              {selectedSchools.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedSchools.length} selected
                </Badge>
              )}
            </div>
            
            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
              {schoolsLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <p className="text-sm text-muted-foreground mt-2">Loading schools...</p>
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                  <SchoolIcon className="h-6 w-6 text-slate-300 mb-2" />
                  <p>No schools found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSchools.map((school) => {
                    const schoolId = school.id || school.school_id;
                    const schoolName = school.name || school.school_name;
                    return (
                    <label
                      key={schoolId} 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors",
                        selectedSchools.includes(schoolId) && "bg-slate-50"
                      )}
                    >
                      <Checkbox 
                        checked={selectedSchools.includes(schoolId)}
                        onCheckedChange={() => toggleSchool(schoolId)}
                      />
                      <span className="text-sm flex-1">{schoolName}</span>
                    </label>
                  );})}
                </div>
              )}
            </div>
          </div>

          {/* Aspect Selection - Simplified */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                Select Aspects
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose which aspects schools should complete
              </p>
            </div>
            
            {/* Quick select options */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={toggleAllCategories}
              >
                {selectedCategories.length === assessmentCategories.length ? 'Deselect all' : 'Select all'} ({assessmentCategories.length})
              </Button>
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCategories.length} selected
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {assessmentCategories.map((cat) => (
                <label
                  key={cat.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedCategories.includes(cat.value) 
                      ? "border-primary bg-primary/5" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Checkbox 
                    checked={selectedCategories.includes(cat.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories(prev => [...prev, cat.value]);
                      } else {
                        setSelectedCategories(prev => prev.filter(c => c !== cat.value));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{getAspectDisplayName(cat.value)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          {/* Due Date & Term Selection - Combined */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">
                Assessment Details
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set the term and optional due date
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="term" className="text-xs text-muted-foreground">
                  Term
                </Label>
                <Select value={term} onValueChange={(val) => setTerm(val as AcademicTerm)}>
                  <SelectTrigger id="term" className="h-9">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {termOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-xs text-muted-foreground">
                  Academic Year
                </Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger id="academicYear" className="h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearOptions.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-xs text-muted-foreground">
                Due Date (Optional)
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "No due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto">
                  <SimpleDatePicker
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setDatePickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-auto pt-4 pb-4 flex-shrink-0">
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
              disabled={selectedCategories.length === 0 || selectedSchools.length === 0 || loading}
              onClick={handleSendInvitations}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 