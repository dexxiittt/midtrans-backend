import midtransClient from 'midtrans-client';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ message: "Backend Midtrans Vercel Aktif!" });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      // ============================================================
      // A. JIKA INI NOTIFIKASI WEBHOOK DARI MIDTRANS
      // ============================================================
      if (body.transaction_status && body.order_id) {
        
        if (body.signature_key && body.status_code && body.gross_amount) {
          const rawSignature = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
          const calculatedSignature = crypto.createHash('sha512').update(rawSignature).digest('hex');

          if (calculatedSignature !== body.signature_key) {
            return res.status(403).json({ error: "Invalid signature key!" });
          }
        }

        const transactionStatus = body.transaction_status;
        const rawOrderId = body.order_id;
        const cleanInvoice = rawOrderId.split('-')[0];

        // --- LANGKAH 2: Ambil data dari custom_field atau fallback key lain ---
        const packageId = body.custom_field1 || body.package_id || "";
        const infoPelanggan = body.custom_field2 || body.informasi_pelanggan || body.customer_info || "";

        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        // ✅ Ganti dengan URL Deployment Web App Anda yang BARU
        const sheetWebhookUrl = "https://script.google.com/macros/s/AKfycbyuZenjpUU7TSD2GpAzTg7sOVYvYHMVSUfMBqAGxDD7-patPEt3dKmMGIsKPGvTFxCi8A/exec";
          
          await fetch(sheetWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice: cleanInvoice,
              package_id: packageId,
              informasi_pelanggan: infoPelanggan
            })
          }).catch(err => console.error("Gagal sync ke Sheet:", err));
        }

        return res.status(200).json({ status: "OK", message: "Webhook processed" });
      }

      // ============================================================
      // B. REQUEST TOKENS SNAP DARI FRONTEND
      // ============================================================
      // --- LANGKAH 1: Tangkap variabel frontend (baik camelCase maupun snake_case) ---
      const orderId = body.orderId || body.order_id;
      const amount = body.amount;
      const packageId = body.packageId || body.package_id;
      const customerInfo = body.customerInfo || body.customer_info || body.informasi_pelanggan;

      if (!orderId || !amount) {
        return res.status(400).json({ error: "orderId dan amount wajib diisi!" });
      }

      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: serverKey
      });

      const parameter = {
        transaction_details: {
          order_id: String(orderId),
          gross_amount: Number(amount)
        },
        // Menyimpan packageId dan customerInfo ke custom_field Midtrans
        custom_field1: packageId ? String(packageId) : "",
        custom_field2: customerInfo ? String(customerInfo) : ""
      };

      const transaction = await snap.createTransaction(parameter);

      return res.status(200).json({
        token: transaction.token,
        redirect_url: transaction.redirect_url
      });

    } catch (error) {
      console.error("Midtrans Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
