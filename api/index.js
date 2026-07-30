import midtransClient from 'midtrans-client';

export default async function handler(req, res) {
  // 1. Setting Header CORS (Agar bisa dipanggil dari GitHub Pages)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle Preflight Request dari Browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. GET Request: Untuk tes apakah backend aktif di browser
  if (req.method === 'GET') {
    return res.status(200).json({
      message: "Backend Midtrans Vercel Aktif & Siap Digunakan!"
    });
  }

  // 3. POST Request: Menerima Order ID & Total dari Frontend, lalu meminta Snap Token
  if (req.method === 'POST') {
    try {
      const { orderId, amount } = req.body || {};

      if (!orderId || !amount) {
        return res.status(400).json({ error: "orderId dan amount wajib diisi!" });
      }

      // Inisialisasi Midtrans Snap Client
      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY
      });

      const parameter = {
        transaction_details: {
          order_id: String(orderId),
          gross_amount: Number(amount)
        }
      };

      // Buat transaksi di Midtrans
      const transaction = await snap.createTransaction(parameter);

      // Kirim Snap Token balik ke Frontend
      return res.status(200).json({
        token: transaction.token,
        redirect_url: transaction.redirect_url
      });
    } catch (error) {
      console.error("Midtrans Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Jika method lain
  return res.status(405).json({ message: "Method not allowed" });
}
