import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Lightbulb, Award } from "lucide-react";

export function AboutPage() {
  return (
    <div className="container max-w-5xl py-16 px-4">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About Assurly</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empowering Multi-Academy Trusts with the tools they need to drive excellence 
            and continuous improvement across all their schools.
          </p>
        </div>

        {/* Story Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Our Story</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Assurly was born from a simple observation: Multi-Academy Trusts were struggling 
              with fragmented spreadsheets, inconsistent assessment processes, and a lack of 
              centralized visibility into school performance across their trust.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Educational leaders needed a better way to ensure consistent standards, track 
              compliance, and identify opportunities for improvement. We built Assurly to be 
              that solution—a platform that brings clarity, consistency, and actionable insights 
              to trust-wide quality assurance.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Today, Assurly serves Multi-Academy Trusts across the UK, helping them streamline 
              their assessment processes, ensure compliance, and drive strategic improvements 
              based on real data.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <Target className="h-5 w-5 text-teal-700" />
                  </div>
                  <CardTitle>Clarity First</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We believe that effective quality assurance starts with clarity. Our platform 
                  provides clear frameworks, transparent processes, and straightforward insights 
                  that everyone can understand and act upon.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Users className="h-5 w-5 text-amber-700" />
                  </div>
                  <CardTitle>User-Centric Design</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every feature is designed with our users in mind—from busy MAT administrators 
                  managing multiple schools to department heads completing assessments. We prioritise 
                  intuitive workflows and efficient processes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <Lightbulb className="h-5 w-5 text-teal-700" />
                  </div>
                  <CardTitle>Continuous Innovation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The education landscape is always evolving, and so are we. We continuously 
                  refine our platform based on user feedback, emerging best practices, and 
                  new regulatory requirements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Award className="h-5 w-5 text-amber-700" />
                  </div>
                  <CardTitle>Excellence in Education</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We're passionate about supporting educational excellence. Our mission is to 
                  empower trusts with the insights they need to celebrate successes, identify 
                  challenges, and drive meaningful improvements.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-6 bg-slate-50 rounded-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center">Built for Education Leaders</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            Our team combines deep expertise in educational governance, quality assurance, 
            and modern software development. We understand the challenges MATs face because 
            we work closely with educational leaders every day.
          </p>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            Whether you're managing a small trust with a handful of schools or a large 
            organisation with dozens of academies, Assurly scales to meet your needs whilst 
            maintaining the simplicity and usability that makes it indispensable.
          </p>
        </section>
      </div>
    </div>
  );
}

