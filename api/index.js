export default (req, res) => {
  res.status(200).json({
    message: "Backend jalan"
  });
};

  return res.status(405).json({
    message: "Method not allowed"
  });
}
