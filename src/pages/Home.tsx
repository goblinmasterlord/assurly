import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { ArrowRight, Building2, CheckCircle2, User2 } from "lucide-react";
import { Link } from "react-router-dom";

export function HomePage() {
  const { role, setRole } = useUser();
  
  return (
    <div className="container max-w-6xl py-12 px-4 md:py-24">
      <div className="flex flex-col space-y-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-amber-500">Assurly</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              A comprehensive platform for Multi-Academy Trusts to manage school maturity ratings
            </p>
          </div>
        </div>
        
        {/* User Roles Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Experience the Platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose a role to explore the platform's functionality
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className={`border-2 transition-colors ${role === "mat-admin" ? "border-teal-600" : "border-slate-200"}`} 
                  onClick={() => setRole("mat-admin")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-teal-700" />
                  </div>
                  <div>
                    <CardTitle>MAT Management</CardTitle>
                    <CardDescription>Trust-level rating management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    As a Multi-Academy Trust administrator, you can oversee ratings across all schools,
                    track progress, and gain insights from aggregated data.
                  </p>
                  <div className="pt-2">
                    <Button variant={role === "mat-admin" ? "default" : "outline"} className="w-full gap-2" 
                            onClick={() => setRole("mat-admin")}>
                      {role === "mat-admin" ? "Currently Selected" : "Switch to This Role"}
                      {role === "mat-admin" && <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={`border-2 transition-colors ${role === "department-head" ? "border-amber-600" : "border-slate-200"}`} 
                  onClick={() => setRole("department-head")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <User2 className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <CardTitle>Department Head</CardTitle>
                    <CardDescription>School-level rating completion</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    As a School Department Head, you can complete ratings for your areas of responsibility,
                    provide evidence, and track your school's progress.
                  </p>
                  <div className="pt-2">
                    <Button variant={role === "department-head" ? "default" : "outline"} className="w-full gap-2" 
                            onClick={() => setRole("department-head")}>
                      {role === "department-head" ? "Currently Selected" : "Switch to This Role"}
                      {role === "department-head" && <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          <h2 className="text-2xl font-bold">Ready to explore?</h2>
          <Button asChild size="lg" className="gap-2">
            <Link to="/app/assessments">
                                  View Ratings <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {/* About Project Section */}
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl p-8 md:p-12 border border-slate-100">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">About Assurly</h2>
              <div className="space-y-4">
                <p>
                  Assurly streamlines the process of evaluating school maturity levels across various operational areas, providing valuable insights for strategic decision-making.
                </p>
                <p>
                  Our platform enables schools to self-assess against defined standards while giving Multi-Academy Trust administrators a clear, filterable overview of performance data.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <h3 className="text-xl font-semibold">Key Features</h3>
              <ul className="space-y-3">
                {[
                  "School self-rating against defined standards",
                  "Centralised dashboard for MAT administrators",
                  "Rating scales with clear descriptors",
                  "Evidence collection and documentation",
                  "Progress tracking and completion status",
                  "Secure user management"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-700 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 