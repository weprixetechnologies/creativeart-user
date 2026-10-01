import Header from '../../components/Header';
import PrivacyContent from '../../components/policies/PrivacyContent';

export const metadata = {
  title: "Privacy Policy | The Creative Arts",
  description: "Privacy Policy for The Creative Arts. Learn how we collect, use, and protect your personal information in compliance with applicable laws.",
  alternates: {
    canonical: "https://thecreativeart.shop/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | The Creative Arts",
    description: "Privacy Policy for The Creative Arts. Learn how we collect, use, and protect your personal information in compliance with applicable laws.",
    url: "https://thecreativeart.shop/privacy-policy",
    siteName: "The Creative Arts",
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl font-playfair font-bold text-slate-800 mb-6">Privacy Policy</h1>
          <APP_COMPONENT_NAME />
        </div>
      </main>
    </div>
  );
}
