import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Privacy Policy | Bazaaric",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: August 22, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy explains how Bazaaric (&quot;we,&quot;
              &quot;us,&quot; &quot;our&quot;) collects, uses, and protects
              your personal data when you use our platform. We are committed
              to complying with the UK GDPR and, for users based in the EU
              (including Lithuania, Latvia, and Estonia), the EU General Data
              Protection Regulation (&quot;GDPR&quot;). For the purposes of
              data protection law, Bazaaric LTD is the data controller of
              your personal data, except where noted in Section 5 in
              relation to our payment processor.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              2. What data we collect
            </h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Account data:</strong> name, email address, and
                password (stored securely via our authentication provider,
                Firebase Authentication).
              </li>
              <li>
                <strong>Listing data:</strong> item titles, descriptions,
                categories, prices, location (as freely entered by you), and
                photos you upload.
              </li>
              <li>
                <strong>Messages:</strong> content of messages exchanged with
                other users through the platform&apos;s chat feature,
                including any offers or order references sent within a
                conversation.
              </li>
              <li>
                <strong>Payment and payout data:</strong> if you make a
                purchase, your payment card details are collected and
                processed directly by Stripe and are never stored on
                Bazaaric&apos;s own servers. If you register as a seller to
                receive payouts, Stripe collects identity verification
                information on our behalf (such as your legal name, date of
                birth, address, and bank details) as part of its own
                Know-Your-Customer process. Bazaaric receives limited
                information back from Stripe — primarily whether your
                account is approved to receive payouts — but does not
                receive or store your full bank details, government ID, or
                other verification documents.
              </li>
              <li>
                <strong>Usage data:</strong> favorites, listing views, order
                and offer history, and general interaction data collected
                automatically to operate the platform.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type,
                and device information, collected automatically by our
                hosting and infrastructure providers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. How we use your data
            </h2>
            <p>We use your data to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Create and manage your account</li>
              <li>Display your listings to other users</li>
              <li>Enable messaging between buyers and sellers</li>
              <li>Process payments and payouts, via Stripe</li>
              <li>Maintain the security and integrity of the platform</li>
              <li>Communicate with you about your account or our service</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data to third parties, and we do
              not use your data for third-party advertising.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Legal basis for processing (GDPR)
            </h2>
            <p>
              We process your data on the following legal bases: performance
              of a contract (to provide the platform&apos;s core
              functionality to you as a registered user, including
              processing a payment you have chosen to make or receive),
              legitimate interests (to maintain and improve the security and
              functioning of the platform, and to prevent fraud), legal
              obligation (where we or Stripe are required to retain
              transaction records for tax, accounting, or anti-money
              laundering purposes), and consent (where explicitly requested,
              such as for optional communications).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Where your data is stored, and our payment processor
            </h2>
            <p>
              We use Google Firebase (Authentication, Firestore Database, and
              Cloud Storage) to store and manage your account, listing, and
              message data. Firebase may store data on servers located
              outside the UK/EU. Google implements Standard Contractual
              Clauses and other safeguards recognized under UK GDPR and EU
              GDPR for such international transfers. You can review
              Google&apos;s data processing terms at
              cloud.google.com/terms/data-processing-terms.
            </p>
            <p className="mt-2">
              Payment and identity verification data is collected and
              processed by Stripe, Inc. and its affiliates, acting as an
              independent data controller for the payment and verification
              information you provide directly to Stripe. Stripe maintains
              its own safeguards for international data transfers. You can
              review Stripe&apos;s privacy policy at
              stripe.com/privacy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Sharing your data with other users
            </h2>
            <p>
              When you create a listing, your listing details and (upon
              starting a conversation) your chosen username become visible to
              other users you interact with, so that a buyer and seller can
              communicate and complete a transaction. If you make or receive
              an in-app payment, the other party can see that a payment or
              offer exists and its amount, but not your card or bank details.
              Do not share sensitive personal or financial information
              through the platform&apos;s messaging feature beyond what is
              necessary.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              7. Data retention
            </h2>
            <p>
              We retain your account and listing data for as long as your
              account remains active. Transaction records are retained for
              as long as required to meet our legal, tax, and accounting
              obligations, even if you later delete your account. If you
              delete your account, we will delete or anonymize your other
              personal data within a reasonable period, except where we are
              required to retain certain data for legal or security
              purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              8. Your rights
            </h2>
            <p>Under UK GDPR and EU GDPR, you have the right to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Object to or restrict certain processing</li>
              <li>
                Withdraw consent at any time, where processing is based on
                consent
              </li>
              <li>
                Lodge a complaint with your local data protection authority
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights over data held by Bazaaric,
              contact us at hello@bazaaric.com. To exercise rights over data
              held directly by Stripe (such as identity verification
              documents), you may need to contact Stripe directly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              9. Cookies
            </h2>
            <p>
              We use essential cookies and similar technologies necessary for
              authentication, payment processing, and core functionality of
              the platform. We do not currently use cookies for advertising
              or third-party tracking purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              10. Children&apos;s privacy
            </h2>
            <p>
              The platform is not intended for use by anyone under 18. We do
              not knowingly collect personal data from children. If you
              believe a child has provided us with personal data, please
              contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              11. Security
            </h2>
            <p>
              We use industry-standard measures, including those provided by
              Firebase Authentication, Firestore security rules, and
              Stripe&apos;s PCI-compliant payment infrastructure, to protect
              your data. However, no method of transmission or storage is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              12. Changes to this policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be communicated via the platform or by email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              13. Contact
            </h2>
            <p>
              For any questions about this Privacy Policy or your data,
              contact us at hello@bazaaric.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}