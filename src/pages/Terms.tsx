import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Terms of Service" description="Combat Market Terms of Service. Read our terms and conditions for using the platform." />
      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-24">
        <h1 className="font-display text-4xl">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated: January 2026</p>

        <div className="mt-8 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing and using Combat Market, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Fighter Eligibility</h2>
            <p className="mt-2">
              To apply as a fighter on Combat Market, you must be at least 18 years old and have 
              verifiable experience in combat sports. We reserve the right to approve or reject 
              any application at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Affiliate Program</h2>
            <p className="mt-2">
              Approved fighters participate in our affiliate program. Commission rates and payment 
              terms are subject to change. Fighters are responsible for accurately representing 
              products and complying with FTC disclosure requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Content Guidelines</h2>
            <p className="mt-2">
              Fighters must not post content that is misleading, offensive, or violates any 
              applicable laws. Combat Market reserves the right to remove any content and 
              terminate accounts that violate these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Limitation of Liability</h2>
            <p className="mt-2">
              Combat Market is not liable for any indirect, incidental, or consequential damages 
              arising from your use of the platform. Our total liability shall not exceed the 
              commissions earned by you in the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Changes to Terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use of Combat Market after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p className="mt-2">
              For questions about these terms, please contact us at legal@combatmarket.com
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
