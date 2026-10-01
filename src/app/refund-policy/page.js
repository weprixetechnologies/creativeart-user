import Header from '../../components/Header';
import RefundContent from '../../components/policies/RefundContent';

export const metadata = {
  title: "Refund Policy | The Creative Arts",
  description: "Refund Policy for The Creative Arts. We do not offer refunds as all our items are handmade and specially crafted for you.",
  alternates: {
    canonical: "https://thecreativeart.shop/refund-policy",
  },
  openGraph: {
    title: "Refund Policy | The Creative Arts",
    description: "Refund Policy for The Creative Arts. We do not offer refunds as all our items are handmade and specially crafted for you.",
    url: "https://thecreativeart.shop/refund-policy",
    siteName: "The Creative Arts",
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl font-playfair font-bold text-slate-800 mb-6">Refund Policy</h1>
          <RefundContent />
        </div>
      </main>
    </div>
  );
}
