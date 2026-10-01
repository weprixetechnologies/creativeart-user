import Header from '../../components/Header';
import ShippingContent from '../../components/policies/ShippingContent';

export const metadata = {
  title: "Shipping Policy | The Creative Arts",
  description: "Shipping Policy for The Creative Arts. Information on shipping times, tracking, and delivery of our handmade items.",
  alternates: {
    canonical: "https://thecreativeart.shop/shipping-policy",
  },
  openGraph: {
    title: "Shipping Policy | The Creative Arts",
    description: "Shipping Policy for The Creative Arts. Information on shipping times, tracking, and delivery of our handmade items.",
    url: "https://thecreativeart.shop/shipping-policy",
    siteName: "The Creative Arts",
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl font-playfair font-bold text-slate-800 mb-6">Shipping Policy</h1>
          <ShippingContent />
        </div>
      </main>
    </div>
  );
}
