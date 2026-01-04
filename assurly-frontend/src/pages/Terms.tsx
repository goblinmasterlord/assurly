export function TermsPage() {
  return (
    <div className="container max-w-4xl py-16 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: November 23, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Welcome to Assurly. These Terms and Conditions ("Terms") govern your use of the 
              Assurly platform and services. By accessing or using Assurly, you agree to be 
              bound by these Terms. If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Assurly provides a strategic assessment platform designed for Multi-Academy Trusts 
              to evaluate school maturity and compliance. These Terms apply to all users, including 
              MAT administrators and school department heads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Account Registration and Access</h2>
            <h3 className="text-xl font-semibold mb-3">2.1 Account Creation</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use Assurly, you must create an account by providing accurate and complete 
              information. You are responsible for maintaining the confidentiality of your 
              account credentials and for all activities that occur under your account.
            </p>
            <h3 className="text-xl font-semibold mb-3">2.2 User Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must be authorised by your Multi-Academy Trust to use the platform</li>
              <li>You must not share your account credentials with unauthorised individuals</li>
              <li>You must notify us immediately of any unauthorised access to your account</li>
              <li>You are responsible for ensuring your contact information is current and accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Acceptable Use Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to use Assurly only for lawful purposes and in accordance with these Terms. 
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the platform in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorised access to any part of the platform or related systems</li>
              <li>Introduce viruses, malware, or any other malicious code</li>
              <li>Attempt to reverse engineer, decompile, or disassemble any part of the platform</li>
              <li>Use the platform to transmit spam, chain letters, or unsolicited communications</li>
              <li>Interfere with or disrupt the platform's operation or servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your use of Assurly is also governed by our Data Processing Agreement (DPA) and 
              Privacy Policy. We are committed to protecting your data in accordance with GDPR 
              and UK data protection laws.
            </p>
            <h3 className="text-xl font-semibold mb-3">4.1 Data Ownership</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain all rights, title, and interest in the data you submit to Assurly. 
              We do not claim ownership of your data and will only use it to provide our services.
            </p>
            <h3 className="text-xl font-semibold mb-3">4.2 Data Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              We process your data in accordance with our Data Processing Agreement, acting as 
              a data processor on behalf of your Multi-Academy Trust (the data controller).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Service Availability and Support</h2>
            <h3 className="text-xl font-semibold mb-3">5.1 Service Uptime</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We strive to maintain 99.9% uptime for the Assurly platform. However, we do not 
              guarantee uninterrupted access and may perform scheduled maintenance with advance notice.
            </p>
            <h3 className="text-xl font-semibold mb-3">5.2 Support Services</h3>
            <p className="text-muted-foreground leading-relaxed">
              Support services are provided according to your subscription plan. We offer email 
              support for all plans, with priority and phone support available for Professional 
              and Enterprise customers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Payment and Billing</h2>
            <h3 className="text-xl font-semibold mb-3">6.1 Subscription Fees</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Access to Assurly requires a paid subscription. Fees are charged in advance on a 
              monthly or annual basis, depending on your chosen plan. All fees are non-refundable 
              except as required by law.
            </p>
            <h3 className="text-xl font-semibold mb-3">6.2 Price Changes</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may change our pricing from time to time. Price changes will be communicated 
              at least 30 days in advance and will take effect at the start of your next billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Assurly platform, including its software, design, content, and trademarks, is 
              owned by Assurly and protected by copyright, trademark, and other intellectual 
              property laws. You are granted a limited, non-exclusive, non-transferable licence 
              to use the platform in accordance with these Terms.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You may not copy, modify, distribute, sell, or lease any part of our platform or 
              included software, nor may you attempt to extract the source code.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To the maximum extent permitted by law, Assurly shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or 
              revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, 
              or other intangible losses.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our total liability shall not exceed the amount you paid to us in the 12 months 
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <h3 className="text-xl font-semibold mb-3">9.1 Termination by You</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may terminate your subscription at any time through your account settings. 
              Termination will take effect at the end of your current billing period.
            </p>
            <h3 className="text-xl font-semibold mb-3">9.2 Termination by Us</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your access to Assurly if you breach these Terms, fail 
              to pay fees, or engage in conduct that we deem harmful to our platform or other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you of any material 
              changes by email or through the platform. Your continued use of Assurly after such 
              changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of 
              England and Wales. Any disputes arising under or in connection with these Terms 
              shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-muted-foreground">Assurly</p>
              <p className="text-muted-foreground">Email: legal@assurly.com</p>
              <p className="text-muted-foreground">Address: London, United Kingdom</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

