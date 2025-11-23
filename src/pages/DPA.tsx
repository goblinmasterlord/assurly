export function DPAPage() {
  return (
    <div className="container max-w-4xl py-16 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Data Processing Agreement</h1>
          <p className="text-muted-foreground">Last updated: November 23, 2025</p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction and Definitions</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This Data Processing Agreement ("DPA") forms part of the Terms and Conditions between 
              you (the "Customer" or "Data Controller") and Assurly (the "Processor") and governs 
              the processing of Personal Data in connection with the Assurly platform.
            </p>
            <h3 className="text-xl font-semibold mb-3">1.1 Definitions</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
              <li><strong>Processing:</strong> Any operation performed on Personal Data, such as collection, storage, use, or disclosure</li>
              <li><strong>Data Subject:</strong> The individual to whom Personal Data relates</li>
              <li><strong>GDPR:</strong> General Data Protection Regulation (EU) 2016/679 and UK GDPR</li>
              <li><strong>Data Protection Laws:</strong> GDPR and all applicable data protection legislation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Scope and Roles</h2>
            <h3 className="text-xl font-semibold mb-3">2.1 Processor Relationship</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Assurly acts as a Data Processor, processing Personal Data on behalf of the Customer 
              (Data Controller) solely for the purpose of providing the Assurly platform and related services.
            </p>
            <h3 className="text-xl font-semibold mb-3">2.2 Data Processing Scope</h3>
            <p className="text-muted-foreground leading-relaxed">
              The processing activities covered by this DPA include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Storage and management of school assessment data</li>
              <li>User authentication and access control</li>
              <li>Generation of analytics and reports</li>
              <li>Platform maintenance and technical support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Customer Obligations</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              As Data Controller, the Customer shall:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Comply with all applicable Data Protection Laws</li>
              <li>Ensure it has all necessary legal bases for processing Personal Data</li>
              <li>Provide all necessary privacy notices to Data Subjects</li>
              <li>Ensure it has obtained all necessary consents from Data Subjects</li>
              <li>Not provide Assurly with any Special Category Data without prior written agreement</li>
              <li>Respond to Data Subject requests in accordance with Data Protection Laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Processor Obligations</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Assurly shall:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Process Personal Data only on documented instructions from the Customer</li>
              <li>Ensure that persons authorized to process Personal Data are bound by confidentiality</li>
              <li>Implement appropriate technical and organisational measures to ensure data security</li>
              <li>Assist the Customer in responding to Data Subject requests</li>
              <li>Notify the Customer without undue delay upon becoming aware of a personal data breach</li>
              <li>Delete or return all Personal Data at the end of the provision of services</li>
              <li>Make available all information necessary to demonstrate compliance with this DPA</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Security Measures</h2>
            <h3 className="text-xl font-semibold mb-3">5.1 Technical Measures</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Assurly implements the following technical security measures:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Encryption of data in transit using TLS 1.3</li>
              <li>Encryption of data at rest using AES-256</li>
              <li>Multi-factor authentication options for user accounts</li>
              <li>Regular security updates and patches</li>
              <li>Automated security monitoring and threat detection</li>
              <li>Secure backup procedures with geo-redundancy</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.2 Organisational Measures</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Assurly implements the following organisational security measures:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Role-based access control with principle of least privilege</li>
              <li>Regular staff training on data protection and security</li>
              <li>Background checks for all personnel with access to Personal Data</li>
              <li>Documented incident response procedures</li>
              <li>Regular security audits and assessments</li>
              <li>Business continuity and disaster recovery plans</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Sub-Processors</h2>
            <h3 className="text-xl font-semibold mb-3">6.1 Authorisation</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Customer provides general authorisation for Assurly to engage sub-processors to 
              assist in providing the services. Assurly maintains a list of current sub-processors 
              available upon request.
            </p>
            <h3 className="text-xl font-semibold mb-3">6.2 Sub-Processor Obligations</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Assurly shall:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Ensure sub-processors are bound by data protection obligations equivalent to this DPA</li>
              <li>Notify the Customer of any intended changes to sub-processors at least 30 days in advance</li>
              <li>Remain fully liable for any sub-processor's performance of data processing obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Data Subject Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Assurly shall, to the extent legally permitted, promptly notify the Customer if it 
              receives a request from a Data Subject to exercise their rights under Data Protection Laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Assurly shall provide reasonable assistance to the Customer in fulfilling its obligation 
              to respond to such requests, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Right of access to Personal Data</li>
              <li>Right to rectification of inaccurate Personal Data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restriction of processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Data Breach Notification</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Upon becoming aware of a Personal Data breach, Assurly shall notify the Customer 
              without undue delay and no later than 48 hours after becoming aware of the breach.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The notification shall include, to the extent possible:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>The nature of the breach, including categories and approximate number of Data Subjects affected</li>
              <li>The likely consequences of the breach</li>
              <li>Measures taken or proposed to address the breach and mitigate potential adverse effects</li>
              <li>Contact details for further information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Data Transfers</h2>
            <h3 className="text-xl font-semibold mb-3">9.1 Data Location</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All Personal Data is stored and processed within the United Kingdom. Assurly does 
              not transfer Personal Data outside the UK without prior written consent from the Customer.
            </p>
            <h3 className="text-xl font-semibold mb-3">9.2 International Transfers</h3>
            <p className="text-muted-foreground leading-relaxed">
              Should any international transfer of Personal Data be required, Assurly shall ensure 
              appropriate safeguards are in place in accordance with Data Protection Laws, including 
              Standard Contractual Clauses or adequacy decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Audits and Compliance</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Assurly shall make available to the Customer all information necessary to demonstrate 
              compliance with this DPA and allow for and contribute to audits, including inspections, 
              conducted by the Customer or an auditor mandated by the Customer.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Audit requests must be made in writing with at least 30 days' notice and shall not 
              occur more than once per year unless required by a supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Data Retention and Deletion</h2>
            <h3 className="text-xl font-semibold mb-3">11.1 Retention</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Assurly shall retain Personal Data only for as long as necessary to provide the 
              services or as required by applicable law.
            </p>
            <h3 className="text-xl font-semibold mb-3">11.2 Deletion</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upon termination of services, Assurly shall delete or return all Personal Data to 
              the Customer within 30 days, unless required by law to retain copies. The Customer 
              may request copies of their data in machine-readable format before deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Liability and Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Each party's liability arising out of or related to this DPA shall be subject to 
              the limitations of liability set forth in the Terms and Conditions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The Customer shall indemnify Assurly against all claims, damages, and losses arising 
              from the Customer's breach of Data Protection Laws or this DPA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For any questions or concerns regarding data processing and protection:
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
              <p className="text-muted-foreground">Data Protection Officer</p>
              <p className="text-muted-foreground">Email: dpo@assurly.com</p>
              <p className="text-muted-foreground">Assurly, London, United Kingdom</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

