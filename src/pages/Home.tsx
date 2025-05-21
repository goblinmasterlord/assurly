import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
      <div className="w-full py-12 lg:py-24">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Welcome to Assurly
            </h1>
            <p className="text-muted-foreground md:text-xl">
              The platform for school maturity assessments
            </p>
          </div>
          <div className="space-x-4">
            <Button asChild size="lg">
              <a href="/assessments">View Assessments</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/reports">View Reports</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 