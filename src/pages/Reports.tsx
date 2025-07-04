import { useState } from "react";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockReports = [
  {
    id: "1",
    name: "Education Overview Report",
    category: "Education",
    schools: 8,
    generated: "2024-07-10",
    author: "John Smith",
  },
  {
    id: "2",
    name: "HR Maturity Analysis",
    category: "Human Resources",
    schools: 12,
    generated: "2024-07-08",
    author: "Emma Johnson",
  },
  {
    id: "3",
    name: "Finance Health Check",
    category: "Finance & Procurement",
    schools: 10,
    generated: "2024-06-28",
    author: "Michael Brown",
  },
  {
    id: "4",
    name: "Compliance Report",
    category: "Governance",
    schools: 15,
    generated: "2024-07-15",
    author: "Sarah Williams",
  },
  {
    id: "5",
    name: "IT Infrastructure Report",
    category: "IT & Information Services",
    schools: 8,
    generated: "2024-07-01",
    author: "David Taylor",
  },
];

export function ReportsPage() {
  const [reports] = useState(mockReports);

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View and generate reports based on assessment data.
          </p>
        </div>
        <Button>Generate Report</Button>
      </div>

      <div className="mt-8">
        <div className="rounded-md border">
          <div className="grid grid-cols-6 bg-muted px-4 py-3 text-sm font-medium">
            <div>Report Name</div>
                            <div>Aspect</div>
            <div>Schools Included</div>
            <div>Generated Date</div>
            <div>Author</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y">
            {reports.map((report) => (
              <div
                key={report.id}
                className="grid grid-cols-6 items-center px-4 py-3"
              >
                <div className="font-medium">{report.name}</div>
                <div>{report.category}</div>
                <div>{report.schools}</div>
                <div>{report.generated}</div>
                <div>{report.author}</div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 