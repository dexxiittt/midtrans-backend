export default function handler(req, res) {
  if (req.method === "GET") {
    if (req.url === "/api/health") {
      return res.status(200).send("OK");
    }

    return res.status(200).json({
      message: "Backend jalan di Vercel 🚀"
    });
  }

  res.status(405).json({ message: "Method not allowed" });
}
