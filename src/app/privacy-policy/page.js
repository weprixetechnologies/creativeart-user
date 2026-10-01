import Header from '../../components/Header';

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl font-playfair font-bold text-slate-800 mb-6">Privacy Policy</h1>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
            <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
