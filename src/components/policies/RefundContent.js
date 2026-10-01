
export default function RefundContent() {
  return (
    <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

      <h2 className="text-xl font-bold text-slate-800">1. No Refunds</h2>
      <p className="font-semibold text-primary-pink">We do not offer refunds.</p>
      <p>As a handmade creation brand, every piece we create is unique, personalized, and made to order specifically for you. Because of the custom and intensive nature of our craft, we cannot offer refunds. Our items cannot be resold or repurposed once they are customized. We appreciate your understanding and support of our handmade art.</p>

      <h2 className="text-xl font-bold text-slate-800">2. Order Issues</h2>
      <p>If you experience any issues with your order upon delivery, please contact us immediately so we can understand the situation and do our best to help.</p>

      <h2 className="text-xl font-bold text-slate-800">3. Contact Us</h2>
      <p>If you have any questions or issues with your order, please reach out to us:</p>
      <p>Email: harikalaarthouse@gmail.com<br/>Phone/WhatsApp: +917454 077 777<br/>Address:<br/>Hno. 225-226<br/>Sector 14, gate no. 1<br/>Pin code 125001<br/>Hisar, Haryana</p>
    </div>
  )
}
