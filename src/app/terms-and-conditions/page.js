import Header from '../../components/Header';
import TermsContent from '../../components/policies/TermsContent';

export const metadata = {
  title: "Terms and Conditions | The Creative Arts",
  description: "Terms and Conditions for The Creative Arts. Read our rules regarding custom orders, intellectual property, and order cancellations.",
  alternates: {
    canonical: "https://thecreativeart.shop/terms-and-conditions",
  },
  openGraph: {
    title: "Terms and Conditions | The Creative Arts",
    description: "Terms and Conditions for The Creative Arts. Read our rules regarding custom orders, intellectual property, and order cancellations.",
    url: "https://thecreativeart.shop/terms-and-conditions",
    siteName: "The Creative Arts",
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl font-playfair font-bold text-slate-800 mb-6">Terms and Conditions</h1>
          <TermsContent />
        </div>
      </main>
    </div>
  );
}
