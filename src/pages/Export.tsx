import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Download, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandingCustomizationModal } from "@/components/BrandingCustomizationModal";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { ButtonLoader } from "@/components/ui/micro-loaders";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ExportPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    setIsGenerating(true);

    // Simulate 5-10 second loading
    const loadingTime = 5000 + Math.random() * 5000;

    setTimeout(async () => {
      try {
        // Create a link to download the PDF from public directory
        const link = document.createElement("a");
        link.href = "/Springwell_pack.pdf";
        link.download = "MAT_Assessment_Report_2024-2025.pdf";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsGenerating(false);
        
        toast({
          title: "Report Generated Successfully",
          description: "Your PDF report has been downloaded.",
        });
      } catch (error) {
        setIsGenerating(false);
        toast({
          title: "Download Failed",
          description: "There was an error downloading the report. Please try again.",
          variant: "destructive",
        });
      }
    }, loadingTime);
  };

  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Export Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive PDF reports with your MAT's branding. Customise it with your MAT's 
          branding including logo and colours. The system generates a comprehensive 
          report covering all assessment areas with trends and commentary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - PDF Preview */}
        <div className="lg:col-span-2">
          <Card className="sticky top-[72px] z-20 shadow-lg">
              <CardHeader className="pb-3 bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Report Preview
                </CardTitle>
                <CardDescription>
                  Preview of the generated PDF report
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden bg-slate-50">
                  <iframe
                    src="/Springwell_pack.pdf"
                    className="w-full h-[calc(100vh-180px)]"
                    title="PDF Preview"
                  />
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Right Sidebar - Scrollable Container */}
        <div className="lg:col-span-1">
          <div className="sticky top-[72px] h-[calc(100vh-88px)] overflow-y-auto pr-2 space-y-6">
            {/* MAT Assessment Report Card - Always Expanded */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  MAT Assessment Report
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Academic Year 2024-2025 • Term: Summer
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Report Overview - Compact */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs font-medium text-slate-700">Schools</p>
                    <p className="text-lg font-bold text-slate-900">4</p>
                  </div>

                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-700">Done</p>
                    <p className="text-lg font-bold text-emerald-900">87%</p>
                  </div>
                  
                  <div className="p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-xs font-medium text-amber-700">Progress</p>
                    <p className="text-lg font-bold text-amber-900">13%</p>
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex-1"
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <ButtonLoader className="mr-1.5" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowCustomizationModal(true)}
                    disabled={isGenerating}
                    size="sm"
                  >
                    <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                    Customise
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Report Writer - Always Expanded */}
            <AISummaryPanel />

            {/* Report Contents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Report Contents</CardTitle>
                <CardDescription className="text-xs">All aspects included in the report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Education", color: "bg-blue-100 text-blue-700 border-blue-200" },
                    { name: "Human Resources", color: "bg-purple-100 text-purple-700 border-purple-200" },
                    { name: "Finance & Procurement", color: "bg-green-100 text-green-700 border-green-200" },
                    { name: "Estates", color: "bg-orange-100 text-orange-700 border-orange-200" },
                    { name: "Governance", color: "bg-red-100 text-red-700 border-red-200" },
                    { name: "IT & Information Services", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
                  ].map((aspect) => (
                    <div
                      key={aspect.name}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200"
                    >
                      <span className="text-xs font-medium text-slate-700">{aspect.name}</span>
                      <Badge variant="outline" className={`text-xs ${aspect.color}`}>
                        Included
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      <BrandingCustomizationModal
        open={showCustomizationModal}
        onOpenChange={setShowCustomizationModal}
      />
    </div>
  );
}

