import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Shield, Users } from "lucide-react";

export function MissionPage() {
  return (
    <div className="container max-w-5xl py-16 px-4">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Our Mission</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            To transform how Multi-Academy Trusts demonstrate oversight, ensure compliance, 
            and drive continuous improvement across all their schools.
          </p>
        </div>

        {/* Mission Statement */}
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-8 md:p-12 border border-indigo-100">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center">What We Believe</h2>
            <p className="text-lg leading-relaxed">
              Every student deserves to attend a school that operates at the highest standards 
              of excellence. Multi-Academy Trusts play a crucial role in ensuring this happens, 
              but they need the right tools to do it effectively.
            </p>
            <p className="text-lg leading-relaxed">
              We believe that quality assurance shouldn't be a burden—it should be an empowering 
              process that provides clarity, celebrates progress, and guides strategic decisions. 
              Assurly exists to make this vision a reality for trusts of all sizes.
            </p>
          </div>
        </section>

        {/* Core Objectives */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Our Core Objectives</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-teal-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Ensure Consistency</h3>
                    <p className="text-muted-foreground">
                      Provide a standardised framework that ensures all schools are evaluated 
                      against the same criteria, creating fair and comparable assessments across 
                      the entire trust.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-amber-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Drive Improvement</h3>
                    <p className="text-muted-foreground">
                      Transform assessment data into actionable insights that help trusts identify 
                      strengths to celebrate, gaps to address, and strategic priorities for 
                      continuous improvement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 flex-shrink-0">
                    <Shield className="h-6 w-6 text-teal-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Demonstrate Accountability</h3>
                    <p className="text-muted-foreground">
                      Provide clear audit trails and comprehensive documentation that demonstrates 
                      robust governance and oversight to regulators, boards, and stakeholders.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 flex-shrink-0">
                    <Users className="h-6 w-6 text-amber-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Empower Teams</h3>
                    <p className="text-muted-foreground">
                      Create intuitive, efficient workflows that respect everyone's time—from 
                      central trust administrators to busy department heads at individual schools.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Vision Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Our Vision for the Future</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
              We envision a future where every Multi-Academy Trust has complete confidence in 
              the quality and compliance of their schools. Where data flows seamlessly from 
              schools to central teams. Where insights drive strategic decisions. And where 
              quality assurance becomes a source of pride, not a burden.
            </p>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="bg-slate-50 rounded-xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Our Commitment to You</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              "We will always prioritise user experience and simplicity over unnecessary complexity",
              "We will continuously evolve our platform based on real feedback from educational leaders",
              "We will maintain the highest standards of security, privacy, and data protection",
              "We will provide responsive support when you need help navigating challenges",
              "We will remain focused on our mission: helping trusts demonstrate excellence and drive improvement"
            ].map((commitment, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-teal-700 flex-shrink-0 mt-0.5" />
                <p className="text-lg">{commitment}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

