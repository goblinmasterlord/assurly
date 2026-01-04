import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MiniTrendChart } from "@/components/ui/mini-trend-chart";

interface BrandingCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandingCustomizationModal({
  open,
  onOpenChange,
}: BrandingCustomizationModalProps) {
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [secondaryColor, setSecondaryColor] = useState("#64748b");

  // Mock assessment data for 4 schools
  const schools = [
    {
      name: "Cedar Park",
      id: "1",
      overallScore: 3.4,
      previousScore: 3.1,
      trend: "up",
      assessments: [
        { aspect: "Education", score: 3.8, trend: [2.8, 3.0, 3.2, 3.5, 3.8] },
        { aspect: "Human Resources", score: 3.2, trend: [3.0, 3.1, 3.0, 3.2, 3.2] },
        { aspect: "Finance", score: 3.6, trend: [3.4, 3.5, 3.5, 3.6, 3.6] },
        { aspect: "Estates", score: 3.1, trend: [2.9, 3.0, 3.0, 3.1, 3.1] },
        { aspect: "Governance", score: 3.5, trend: [3.2, 3.3, 3.4, 3.5, 3.5] },
        { aspect: "IT & IS", score: 3.3, trend: [3.0, 3.1, 3.2, 3.3, 3.3] },
      ],
    },
    {
      name: "Maple Grove",
      id: "2",
      overallScore: 2.9,
      previousScore: 2.8,
      trend: "up",
      assessments: [
        { aspect: "Education", score: 3.2, trend: [2.8, 2.9, 3.0, 3.1, 3.2] },
        { aspect: "Human Resources", score: 2.8, trend: [2.6, 2.7, 2.7, 2.8, 2.8] },
        { aspect: "Finance", score: 3.1, trend: [2.9, 3.0, 3.0, 3.1, 3.1] },
        { aspect: "Estates", score: 2.7, trend: [2.5, 2.6, 2.6, 2.7, 2.7] },
        { aspect: "Governance", score: 2.9, trend: [2.7, 2.8, 2.8, 2.9, 2.9] },
        { aspect: "IT & IS", score: 2.8, trend: [2.6, 2.7, 2.7, 2.8, 2.8] },
      ],
    },
    {
      name: "Willow High",
      id: "3",
      overallScore: 2.3,
      previousScore: 2.5,
      trend: "down",
      assessments: [
        { aspect: "Education", score: 2.5, trend: [2.8, 2.7, 2.6, 2.5, 2.5] },
        { aspect: "Human Resources", score: 2.2, trend: [2.4, 2.3, 2.3, 2.2, 2.2] },
        { aspect: "Finance", score: 2.4, trend: [2.6, 2.5, 2.5, 2.4, 2.4] },
        { aspect: "Estates", score: 2.1, trend: [2.3, 2.2, 2.2, 2.1, 2.1] },
        { aspect: "Governance", score: 2.3, trend: [2.5, 2.4, 2.4, 2.3, 2.3] },
        { aspect: "IT & IS", score: 2.4, trend: [2.6, 2.5, 2.5, 2.4, 2.4] },
      ],
    },
    {
      name: "Oak Hill Academy",
      id: "4",
      overallScore: 3.7,
      previousScore: 3.6,
      trend: "up",
      assessments: [
        { aspect: "Education", score: 4.0, trend: [3.6, 3.7, 3.8, 3.9, 4.0] },
        { aspect: "Human Resources", score: 3.6, trend: [3.4, 3.5, 3.5, 3.6, 3.6] },
        { aspect: "Finance", score: 3.8, trend: [3.6, 3.7, 3.7, 3.8, 3.8] },
        { aspect: "Estates", score: 3.5, trend: [3.3, 3.4, 3.4, 3.5, 3.5] },
        { aspect: "Governance", score: 3.8, trend: [3.6, 3.7, 3.7, 3.8, 3.8] },
        { aspect: "IT & IS", score: 3.5, trend: [3.3, 3.4, 3.4, 3.5, 3.5] },
      ],
    },
  ];

  // Calculate MAT-wide averages
  const matAverage = schools.reduce((sum, s) => sum + s.overallScore, 0) / schools.length;

  const aspectAverages = [
    {
      name: "Education",
      score: schools.reduce((sum, s) => sum + s.assessments[0].score, 0) / schools.length,
      commentary: "Strong performance across the trust with Cedar Park and Oak Hill leading. Willow High requires focused support.",
    },
    {
      name: "Human Resources",
      score: schools.reduce((sum, s) => sum + s.assessments[1].score, 0) / schools.length,
      commentary: "Recruitment and retention strategies showing positive impact. Continue professional development initiatives.",
    },
    {
      name: "Finance & Procurement",
      score: schools.reduce((sum, s) => sum + s.assessments[2].score, 0) / schools.length,
      commentary: "Robust financial governance across all schools. Value for money initiatives delivering results.",
    },
    {
      name: "Estates",
      score: schools.reduce((sum, s) => sum + s.assessments[3].score, 0) / schools.length,
      commentary: "Estate management improving trust-wide. Capital investment plans on track for 2025-2026.",
    },
    {
      name: "Governance",
      score: schools.reduce((sum, s) => sum + s.assessments[4].score, 0) / schools.length,
      commentary: "Strong governance structures in place. Board effectiveness reviews demonstrate continuous improvement.",
    },
    {
      name: "IT & Information Services",
      score: schools.reduce((sum, s) => sum + s.assessments[5].score, 0) / schools.length,
      commentary: "Digital infrastructure upgrades progressing well. Cybersecurity compliance maintained across trust.",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "text-emerald-700";
    if (score >= 2.5) return "text-amber-700";
    return "text-rose-700";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 3.5) return "bg-emerald-50 border-emerald-200";
    if (score >= 2.5) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Report Branding</DialogTitle>
          <DialogDescription>
            Personalize your PDF report with your MAT's branding and review assessment data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="data">Assessment Data</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo">MAT Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: PNG or JPG, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#1e40af"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#64748b"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Preview</Label>
                <div className="flex gap-3">
                  <div
                    className="h-16 flex-1 rounded-lg border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="h-16 flex-1 rounded-lg border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Assessment Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <div className="space-y-4">
              {/* MAT Overview */}
              <Card className={getScoreBgColor(matAverage)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">MAT Average Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(matAverage)}`}>
                        {matAverage.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Term: 2024-2025 (Summer)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">4 Schools</p>
                      <p className="text-xs text-slate-500 mt-1">All 6 aspects assessed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* School-by-School Breakdown */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">School Performance</h3>
                {schools.map((school) => (
                  <Card key={school.id} className="border-slate-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{school.name}</h4>
                          <Badge
                            variant="outline"
                            className={
                              school.trend === "up"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }
                          >
                            {school.trend === "up" ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {school.trend === "up" ? "Improving" : "Declining"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getScoreColor(school.overallScore)}`}>
                            {school.overallScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {school.trend === "up" ? "+" : ""}
                            {(school.overallScore - school.previousScore).toFixed(1)} vs last term
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {school.assessments.map((assessment) => (
                          <div
                            key={assessment.aspect}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs"
                          >
                            <span className="text-slate-600 truncate">{assessment.aspect}</span>
                            <span className={`font-semibold ${getScoreColor(assessment.score)}`}>
                              {assessment.score.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Aspect Averages with Commentary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">MAT-Wide Aspect Analysis</h3>
                {aspectAverages.map((aspect) => (
                  <Card key={aspect.name} className="border-slate-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{aspect.name}</h4>
                            <span className={`text-lg font-bold ${getScoreColor(aspect.score)}`}>
                              {aspect.score.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {aspect.commentary}
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={(aspect.score / 4) * 100}
                        className="h-2 mt-2"
                        indicatorClassName={
                          aspect.score >= 3.5
                            ? "bg-emerald-500"
                            : aspect.score >= 2.5
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-6 bg-slate-50">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 bg-white border rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Springwell MAT Assessment Report</h3>
                  <p className="text-sm text-slate-600">Academic Year 2024-2025</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border space-y-4">
                <div
                  className="h-2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                  }}
                />

                <div className="space-y-2">
                  <h4 className="font-semibold" style={{ color: primaryColor }}>
                    Executive Summary
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This comprehensive report provides an overview of assessment performance across
                    all schools within the Multi-Academy Trust for the Summer term 2024-2025. The
                    report includes detailed analysis of all six key aspects: Education, Human
                    Resources, Finance & Procurement, Estates, Governance, and IT & Information
                    Services.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {aspectAverages.slice(0, 4).map((aspect) => (
                    <div key={aspect.name} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">{aspect.name}</p>
                      <p className={`text-lg font-bold ${getScoreColor(aspect.score)}`}>
                        {aspect.score.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-center text-slate-500">
                    This is a preview of your customized report layout
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save Preferences</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

