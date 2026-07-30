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

  // 3. POST Request: Menangani Webhook Midtrans ATAU Request Token dari Frontend
  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      // ============================================================
      // A. JIKA INI NOTIFIKASI WEBHOOK DARI MIDTRANS
      // ============================================================
      if (body.transaction_status && body.order_id) {
        const transactionStatus = body.transaction_status;
        const rawOrderId = body.order_id;

        // Ambil invoiceID asli (menghapus suffix timestamp unik)
        const cleanInvoice = rawOrderId.split('-')[0];

        console.log(`[Webhook Midtrans] Invoice: ${cleanInvoice} | Status: ${transactionStatus}`);

        // Jika transaksi berhasil (settlement atau capture)
        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
          
          // (Opsional) URL Webhook Google Apps Script milikmu jika ingin update otomatis ke Google Sheet
          const sheetWebhookUrl = "https://script.google.com/macros/s/AKfycbx_YOUR_APPS_SCRIPT_ID/exec";

          if (sheetWebhookUrl && !sheetWebhookUrl.includes("YOUR_APPS_SCRIPT_ID")) {
            await fetch(sheetWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                invoice: cleanInvoice,
                status: "success"
              })
            }).catch(err => console.error("Gagal sync ke Sheet:", err));
          }
        }

        // Beri respon 200 OK ke Midtrans agar tidak dikirim ulang
        return res.status(200).json({ status: "OK", message: "Webhook processed successfully" });
      }

      // ============================================================
      // B. JIKA INI REQUEST BIASA DARI FRONTEND (MEMINTA SNAP TOKEN)
      // ============================================================
      const { orderId, amount } = body;

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

      // Kirim Snap Token & Redirect URL balik ke Frontend
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
