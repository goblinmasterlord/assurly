import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, FileCheck, Users, Server, AlertTriangle } from "lucide-react";

export function SecurityPage() {
  return (
    <div className="container max-w-5xl py-16 px-4">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Shield className="h-8 w-8 text-teal-700" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Security & Compliance</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your data security and privacy are our top priorities. We implement industry-leading 
            security measures to protect your trust's sensitive information.
          </p>
        </div>

        {/* Key Security Features */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                  <Lock className="h-5 w-5 text-teal-700" />
                </div>
                <CardTitle className="text-lg">End-to-End Encryption</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All data is encrypted in transit using TLS 1.3 and at rest using AES-256 
                encryption, ensuring your information remains secure at all times.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Users className="h-5 w-5 text-amber-700" />
                </div>
                <CardTitle className="text-lg">Role-Based Access Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Granular permission controls ensure users only access data relevant to their 
                role, with comprehensive audit trails tracking all system access.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                  <Eye className="h-5 w-5 text-teal-700" />
                </div>
                <CardTitle className="text-lg">Multi-Factor Authentication</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Optional MFA adds an extra layer of security to user accounts, preventing 
                unauthorised access even if credentials are compromised.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Database className="h-5 w-5 text-amber-700" />
                </div>
                <CardTitle className="text-lg">Regular Backups</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automated daily backups with point-in-time recovery ensure your data is never 
                lost, with geo-redundant storage across multiple regions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                  <AlertTriangle className="h-5 w-5 text-teal-700" />
                </div>
                <CardTitle className="text-lg">Security Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                24/7 security monitoring and automated threat detection identify and respond 
                to potential security issues before they become problems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Server className="h-5 w-5 text-amber-700" />
                </div>
                <CardTitle className="text-lg">UK Data Hosting</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All data is hosted on secure servers within the UK, ensuring compliance with 
                UK data protection regulations and data sovereignty requirements.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Compliance Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Compliance & Standards</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <FileCheck className="h-5 w-5 text-teal-700" />
                  </div>
                  <CardTitle>GDPR Compliant</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  We are fully compliant with the General Data Protection Regulation (GDPR), 
                  ensuring your trust meets all data protection requirements.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>Right to access and data portability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>Right to erasure and correction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>Data processing agreements available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>Comprehensive privacy impact assessments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Shield className="h-5 w-5 text-amber-700" />
                  </div>
                  <CardTitle>ISO 27001 Standards</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Our security practices align with ISO 27001 information security management 
                  standards, providing comprehensive protection for your data.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>Regular security audits and assessments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>Documented security policies and procedures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>Incident response and business continuity plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>Ongoing staff security training</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Privacy Section */}
        <section className="bg-slate-50 rounded-xl p-8 md:p-12 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Your Data, Your Control</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe you should have complete control over your data. That's why we provide:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold flex-shrink-0">1</span>
                <div>
                  <p className="font-semibold">Full Data Ownership</p>
                  <p className="text-muted-foreground">Your data belongs to you. We never use it for any purpose other than providing our service.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold flex-shrink-0">2</span>
                <div>
                  <p className="font-semibold">Easy Data Export</p>
                  <p className="text-muted-foreground">Export all your data at any time in standard formats (CSV, JSON) with a single click.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold flex-shrink-0">3</span>
                <div>
                  <p className="font-semibold">Data Deletion Guarantees</p>
                  <p className="text-muted-foreground">When you request data deletion, it's permanently removed from all systems within 30 days.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold flex-shrink-0">4</span>
                <div>
                  <p className="font-semibold">Transparent Processing</p>
                  <p className="text-muted-foreground">Clear documentation of exactly how we process, store, and protect your data.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Security Best Practices for Users</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            While we provide robust security infrastructure, user security practices are equally important:
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="space-y-3 p-6 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-lg">Strong Passwords</h3>
              <p className="text-muted-foreground">
                Use unique, complex passwords for your Assurly account. We recommend using a 
                password manager to generate and store secure passwords.
              </p>
            </div>
            <div className="space-y-3 p-6 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-lg">Enable MFA</h3>
              <p className="text-muted-foreground">
                Multi-factor authentication adds critical protection to your account. Enable 
                it in your account settings for maximum security.
              </p>
            </div>
            <div className="space-y-3 p-6 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-lg">Regular Access Reviews</h3>
              <p className="text-muted-foreground">
                Periodically review user accounts and permissions. Remove access for users 
                who no longer need it.
              </p>
            </div>
            <div className="space-y-3 p-6 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-lg">Secure Devices</h3>
              <p className="text-muted-foreground">
                Ensure devices used to access Assurly are secure, with up-to-date operating 
                systems and antivirus protection.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-br from-teal-50 to-amber-50 rounded-xl p-8 md:p-12 text-center border border-teal-100">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Questions About Security?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our security team is available to discuss your specific requirements and answer 
            any questions about how we protect your data.
          </p>
          <p className="text-muted-foreground">
            Contact us at <a href="mailto:security@assurly.com" className="text-teal-700 font-semibold hover:underline">security@assurly.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}

