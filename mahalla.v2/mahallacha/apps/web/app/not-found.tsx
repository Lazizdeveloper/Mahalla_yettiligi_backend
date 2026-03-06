export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Sahifa topilmadi (404)</h1>
        <p className="text-sm text-gray-600">
          Siz kirmoqchi bo‘lgan sahifa mavjud emas yoki manzil noto‘g‘ri kiritilgan.
        </p>
        <a
          href="/login"
          className="inline-flex justify-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Login sahifasiga qaytish
        </a>
      </div>
    </main>
  );
}

