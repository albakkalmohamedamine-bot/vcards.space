import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
        Return Home
      </Link>
    </div>
  );
}
