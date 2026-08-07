import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Terms of Service | Bazaaric",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: [Date]</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              1. Who we are
            </h2>
            <p>
              Bazaaric ("Bazaaric," "we," "us," or "our") is operated by
              Bazaaric LTD, a company registered in England and Wales, with a
              registered address at [Address]. You can contact us at
              hello@bazaaric.com. Bazaaric provides an online platform ("the
              Platform") that allows users to list, browse, and communicate
              about items for sale, primarily within Lithuania, Latvia, and
              Estonia.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              2. Acceptance of these terms
            </h2>
            <p>
              By creating an account or using the Platform in any way, you
              agree to be bound by these Terms of Service and our Privacy
              Policy. If you do not agree, you must not use the Platform.
              You must be at least 18 years old, or the age of legal majority
              in your jurisdiction, to create an account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. What Bazaaric is — and what it is not
            </h2>
            <p>
              Bazaaric is a platform that connects buyers and sellers. We are{" "}
              <strong>not a party to any transaction, sale, or agreement</strong>{" "}
              that takes place between users. We do not own, inspect, handle,
              ship, or take title to any item listed on the Platform.
            </p>
            <p className="mt-2">
              <strong>Currently, Bazaaric does not process payments and does
              not arrange or provide delivery or shipping services.</strong>{" "}
              Any exchange of money, arrangement of delivery or collection,
              and the item itself is negotiated and completed directly and
              independently between buyer and seller, entirely outside the
              Platform. You do this at your own risk and discretion. We may
              introduce in-app payments and/or delivery integration in the
              future, at which point these Terms will be updated accordingly
              and you will be notified before such features apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Your account
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activity that occurs under your
              account. You agree to provide accurate information when
              creating your account and listings. We reserve the right to
              suspend or terminate any account at our discretion, including
              for suspected violation of these Terms, fraudulent activity, or
              behavior that harms other users or the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Listings and prohibited items
            </h2>
            <p>
              Sellers are solely responsible for the accuracy of their
              listings, including item condition, description, and price, and
              for ensuring they have the legal right to sell the item listed.
              You may not list: counterfeit or replica goods; stolen
              property; weapons, ammunition, or explosives; illegal drugs or
              controlled substances; live animals; hazardous materials;
              items that infringe intellectual property rights; or any item
              prohibited by applicable law. We reserve the right to remove
              any listing at our discretion without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Transactions between users
            </h2>
            <p>
              Because Bazaaric does not process payments, verify items, or
              arrange delivery, all aspects of a transaction — including
              price negotiation, payment method, meeting arrangements or
              shipping, item inspection, and dispute resolution — are the
              sole responsibility of the buyer and seller involved.{" "}
              <strong>
                We strongly recommend meeting in safe, public locations for
                in-person exchanges, inspecting items before paying, and never
                sharing sensitive financial information through the
                Platform's messaging feature.
              </strong>{" "}
              We are not responsible for the quality, safety, legality, or
              delivery of any item, or for any dispute, loss, or harm arising
              from a transaction between users.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              7. User conduct
            </h2>
            <p>
              You agree not to: harass, threaten, or abuse other users;
              impersonate any person or entity; use the Platform for any
              unlawful purpose; attempt to circumvent, disable, or interfere
              with the Platform's security or functionality; or scrape,
              copy, or misuse data from the Platform. We reserve the right to
              remove content or restrict access for any user who violates
              this section.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              8. Intellectual property
            </h2>
            <p>
              The Platform, including its design, branding, and underlying
              software, is owned by Bazaaric and protected by intellectual
              property laws. Content you upload (listing photos,
              descriptions, messages) remains yours, but by posting it you
              grant Bazaaric a non-exclusive, royalty-free license to display
              and distribute that content as necessary to operate the
              Platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              9. Disclaimer of warranties
            </h2>
            <p>
              The Platform is provided "as is" and "as available," without
              warranties of any kind, express or implied, including
              warranties of merchantability, fitness for a particular
              purpose, or non-infringement. We do not warrant that the
              Platform will be uninterrupted, error-free, or secure, or that
              any listing or user is accurate, safe, or legitimate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              10. Limitation of liability
            </h2>
            <p>
              To the fullest extent permitted by law, Bazaaric and its
              operators shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of
              profits, data, or goodwill, arising from your use of the
              Platform or any transaction between users — including but not
              limited to non-delivery of an item, item misrepresentation,
              payment disputes, or any interaction between users, whether
              conducted on or off the Platform. Where liability cannot be
              excluded under applicable law, our total liability is limited
              to the greater of [€50] or the amount you paid us in the 12
              months preceding the claim (noting that, as we do not currently
              charge fees, this amount is presently €0).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              11. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless Bazaaric, its
              operators, and affiliates from any claims, damages, losses, or
              expenses (including reasonable legal fees) arising from your
              use of the Platform, your listings, your transactions with
              other users, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              12. Termination
            </h2>
            <p>
              You may stop using the Platform and delete your account at any
              time. We may suspend or terminate your access at our
              discretion, with or without notice, particularly in cases of
              suspected fraud, abuse, or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              13. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. Material changes
              will be communicated via the Platform or by email. Continued
              use of the Platform after changes take effect constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              14. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of England and Wales,
              without regard to conflict of law principles. Any disputes
              arising from these Terms or your use of the Platform shall be
              subject to the exclusive jurisdiction of the courts of England
              and Wales, save that if you are a consumer resident in the EU,
              you may also be entitled to bring proceedings in your country
              of residence under applicable consumer protection law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              15. Contact
            </h2>
            <p>
              Questions about these Terms can be sent to hello@bazaaric.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}