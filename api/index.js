export default (req, res) => {
  res.status(200).json({
    message: "Backend jalan di Vercel 🚀"
  });
};

  return res.status(405).json({
    message: "Method not allowed"
  });
}
