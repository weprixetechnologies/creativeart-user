
export default function ShippingContent() {
  return (
    <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
      <p>Welcome to the Shipping Policy of The Creative Arts.</p>

      <h2 className="text-xl font-bold text-slate-800">1. General Shipping Rules</h2>
      <ul className="list-disc pl-5 font-semibold text-slate-700">
        <li>Shipping details (courier name, tracking number/link) are updated in the customer's order when the order is shipped.</li>
        <li>Shipping charges are to be paid by the customer.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-800">2. Processing & Shipping Timelines</h2>
      <p>Shipping is based upon the availability of products and the extent of customization required. Generally, shipping takes 3-4 days once the product is ready and dispatched.</p>

      <h2 className="text-xl font-bold text-slate-800">3. Shipping Partners & Tracking</h2>
      <p>We use reliable third-party courier partners to deliver your items safely. Once your item is dispatched, you can find the tracking link and courier details in your order page on our website.</p>

      <h2 className="text-xl font-bold text-slate-800">4. Delivery Timelines & Delays</h2>
      <p>Delivery timelines provided are estimates and are not guaranteed. We are not responsible for delays caused by courier partners, adverse weather conditions, natural disasters, or other events beyond our control.</p>

      <h2 className="text-xl font-bold text-slate-800">5. Customer Responsibility</h2>
      <p>It is the customer's responsibility to provide a complete and accurate shipping address at checkout. If a parcel is undeliverable or returned to us due to an incorrect address, the customer will be responsible for any additional shipping charges to resend the package.</p>

      <h2 className="text-xl font-bold text-slate-800">6. Areas Served</h2>
      <p>We proudly ship all across India.</p>

      <h2 className="text-xl font-bold text-slate-800">7. Contact for Shipping Queries</h2>
      <p>Email: harikalaarthouse@gmail.com<br/>Phone/WhatsApp: +917454 077 777<br/>Address:<br/>Hno. 225-226<br/>Sector 14, gate no. 1<br/>Pin code 125001<br/>Hisar, Haryana</p>
    </div>
  )
}
