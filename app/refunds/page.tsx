import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Refund Policy | Bazaaric",
};

export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-28 md:pb-12">
      <Navbar />

      <div className="mx-auto max-w-md md:max-w-3xl px-4 md:px-8 pt-6 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Refund Policy
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: August 22, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              1. Scope of this policy
            </h2>
            <p>
              This Refund Policy applies only to purchases made through
              Bazaaric's in-app payment system (Buy Now or a paid, accepted
              offer). It does not apply to transactions arranged and
              completed independently between a buyer and seller outside the
              Platform's payment system, which must be resolved directly
              between those parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              2. Cancelling a paid order
            </h2>
            <p>
              Bazaaric does not currently provide shipping, tracking, or
              delivery confirmation. Because of this, either the buyer or
              the seller may cancel a paid order at any time before it is
              confirmed complete by both parties, directly from the Offers
              page or the relevant chat conversation. Cancelling a paid order
              triggers an automatic full refund, including the buyer
              protection fee, and the listing is made available for purchase
              again.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              3. How refunds are issued
            </h2>
            <p>
              Refunds are issued to your original payment method through
              Stripe. Depending on your card issuer or bank, a refund can
              take several business days to appear on your statement after
              it is processed. Bazaaric does not charge a fee to process a
              refund.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              4. Disputes after both parties confirm completion
            </h2>
            <p>
              Once both the buyer and seller have marked an order as
              complete, the automatic cancellation option described in
              Section 2 is no longer available. If a problem arises after
              this point — for example, an item that does not match its
              description — contact the other party directly through
              Bazaaric's chat in the first instance. If you cannot reach a
              resolution, contact us at hello@bazaaric.com and we will review
              the matter; Bazaaric may, at its discretion, assist in
              resolving the dispute, but is not obligated to issue a refund
              for a completed order.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              5. Your statutory rights
            </h2>
            <p>
              This policy describes the cancellation mechanism built into the
              Bazaaric platform. It does not limit or replace any statutory
              consumer protection rights you may separately be entitled to
              under the law of your country of residence. Because Bazaaric is
              a marketplace connecting private individual sellers with
              buyers, the applicability of certain distance-selling rights
              (such as a statutory right of withdrawal that typically applies
              to purchases from a business) can depend on the specific
              circumstances of a sale. If you believe you have a statutory
              right that this policy does not address, please contact us at
              hello@bazaaric.com.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              6. Changes to this policy
            </h2>
            <p>
              We may update this Refund Policy from time to time, particularly
              as we introduce delivery tracking or other features. Material
              changes will be communicated via the Platform or by email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              7. Contact
            </h2>
            <p>
              Questions about this policy or a specific order can be sent to
              hello@bazaaric.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}