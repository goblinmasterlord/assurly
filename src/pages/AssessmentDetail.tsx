import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import {
  mockAssessmentsAdmin,
  mockAssessmentsForDeptHead,
} from "@/lib/mock-data";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Save,
  School,
  User,
} from "lucide-react";
import { RatingLabels, type Rating, type Standard } from "@/types/assessment";

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUser();
  
  // Get the assessment based on user role
  const isMatAdmin = role === "mat-admin";
  const assessments = isMatAdmin ? mockAssessmentsAdmin : mockAssessmentsForDeptHead;
  const assessment = assessments.find(a => a.id === id);
  
  const [activeStandard, setActiveStandard] = useState<Standard | null>(
    assessment?.standards && assessment.standards.length > 0
      ? assessment.standards[0]
      : null
  );
  
  const [ratings, setRatings] = useState<Record<string, Rating>>(
    assessment?.standards
      ? assessment.standards.reduce((acc, standard) => {
          acc[standard.id] = standard.rating;
          return acc;
        }, {} as Record<string, Rating>)
      : {}
  );
  
  const [evidence, setEvidence] = useState<Record<string, string>>(
    assessment?.standards
      ? assessment.standards.reduce((acc, standard) => {
          acc[standard.id] = standard.evidence || "";
          return acc;
        }, {} as Record<string, string>)
      : {}
  );
  
  if (!assessment) {
    return (
      <div className="container py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessments")}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>
              The assessment you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/assessments">Return to Assessments</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Calculate progress
  const completedCount = Object.values(ratings).filter(r => r !== null).length;
  const totalCount = assessment.standards?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const handleRatingChange = (standardId: string, value: Rating) => {
    setRatings(prev => ({
      ...prev,
      [standardId]: value,
    }));
  };
  
  const handleEvidenceChange = (standardId: string, value: string) => {
    setEvidence(prev => ({
      ...prev,
      [standardId]: value,
    }));
  };
  
  const handleSave = () => {
    // In a real app, this would save to the backend
    // For now, we'll just show a success message
    alert("Assessment progress saved!");
  };
  
  const handleSubmit = () => {
    // In a real app, this would submit the assessment
    // For now, we'll just show a success message
    alert("Assessment submitted successfully!");
    navigate("/assessments");
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Not Started":
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
      case "Overdue":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }
  };
  
  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/assessments")}
          className="mr-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessments
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Assessment Info Card */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{assessment.name}</CardTitle>
                <CardDescription>
                  {assessment.school.name} • {assessment.category}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(assessment.status)}>
                {assessment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-4">
                <School className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">School</p>
                  <p className="text-sm text-muted-foreground">
                    {assessment.school.name}
                  </p>
                </div>
              </div>
              
              {assessment.assignedTo && assessment.assignedTo.length > 0 && (
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <p className="text-sm text-muted-foreground">
                      {assessment.assignedTo[0].name}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {assessment.dueDate || "No due date"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {completedCount}/{totalCount} Standards
                    </p>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Only show assessment form for department heads or in-progress assessments */}
        {(role === "department-head" || assessment.status !== "Completed") && assessment.standards && (
          <>
            {/* Standards List */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Standards</h3>
              <div className="space-y-2">
                {assessment.standards.map((standard, index) => (
                  <Button
                    key={standard.id}
                    variant={activeStandard?.id === standard.id ? "default" : "outline"}
                    className="w-full justify-between"
                    onClick={() => setActiveStandard(standard)}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{standard.code}</span>
                      <span className="truncate">{standard.title}</span>
                    </div>
                    <div className="flex items-center">
                      {ratings[standard.id] !== null && (
                        <Badge variant="outline" className="mr-2">
                          {ratings[standard.id] && RatingLabels[ratings[standard.id] as 1 | 2 | 3 | 4]}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Standard Detail */}
            <div className="md:col-span-2">
              {activeStandard && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeStandard.code}: {activeStandard.title}
                    </CardTitle>
                    <CardDescription>
                      {activeStandard.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-3">Rating</h4>
                        <RadioGroup
                          value={ratings[activeStandard.id]?.toString() || ""}
                          onValueChange={(value) => 
                            handleRatingChange(
                              activeStandard.id, 
                              value ? parseInt(value) as Rating : null
                            )
                          }
                          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                          disabled={role !== "department-head" || assessment.status === "Completed"}
                        >
                          {[1, 2, 3, 4].map((rating) => (
                            <div key={rating} className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={rating.toString()}
                                id={`rating-${activeStandard.id}-${rating}`}
                              />
                              <FormLabel
                                htmlFor={`rating-${activeStandard.id}-${rating}`}
                                className="font-normal"
                              >
                                {rating}: {RatingLabels[rating as 1 | 2 | 3 | 4]}
                              </FormLabel>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-3">Evidence / Comments</h4>
                        <Textarea
                          placeholder="Provide evidence to support your rating..."
                          value={evidence[activeStandard.id] || ""}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleEvidenceChange(activeStandard.id, e.target.value)}
                          disabled={role !== "department-head" || assessment.status === "Completed"}
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                  
                  {role === "department-head" && assessment.status !== "Completed" && (
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Progress
                      </Button>
                      <Button onClick={handleSubmit}>
                        <Check className="mr-2 h-4 w-4" />
                        Submit Assessment
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )}
            </div>
          </>
        )}
        
        {/* Show read-only view for completed assessments for MAT admins */}
        {role === "mat-admin" && assessment.status === "Completed" && assessment.standards && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {assessment.standards.map((standard) => (
                  <div key={standard.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">
                        {standard.code}: {standard.title}
                      </h3>
                      {standard.rating && (
                        <Badge>
                          {standard.rating}: {RatingLabels[standard.rating]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4">{standard.description}</p>
                    {standard.evidence && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Evidence / Comments:</h4>
                        <p className="text-sm">{standard.evidence}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 