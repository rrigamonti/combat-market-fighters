import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Privacy Policy" description="Combat Market Privacy Policy. Learn how we collect, use, and protect your personal information." />
      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-24">
        <h1 className="font-display text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: January 2026</p>

        <div className="mt-8 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide directly, including your name, email address, 
              sport discipline, country, and biographical information when you register as a fighter. 
              We also collect usage data and analytics to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="mt-2">
              We use your information to operate your fighter storefront, process affiliate 
              commissions, communicate with you about your account, and improve our platform. 
              Your public profile information is displayed on your storefront.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Information Sharing</h2>
            <p className="mt-2">
              We do not sell your personal information. We may share data with affiliate partners 
              for commission tracking, service providers who help operate our platform, and when 
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p className="mt-2">
              We implement industry-standard security measures to protect your data. However, 
              no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
            <p className="mt-2">
              We use cookies and similar technologies to maintain your session, remember your 
              preferences, and analyze platform usage. You can control cookies through your 
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p className="mt-2">
              You may access, update, or delete your account information at any time through 
              your dashboard. To request complete data deletion, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p className="mt-2">
              For privacy-related questions, please contact us at privacy@combatmarket.com
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
