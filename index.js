const express = require('express')
const midtransClient = require('midtrans-client')

const app = express()
app.use(express.json())

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY
})

app.get('/', (req, res) => {
  res.send('Backend jalan 🚀')
})

app.post('/create-transaction', async (req, res) => {

  const { order_id, gross_amount } = req.body

  let parameter = {
    transaction_details: {
      order_id: order_id,
      gross_amount: gross_amount
    }
  }

  try {
    const transaction = await snap.createTransaction(parameter)
    res.json({ token: transaction.token })
  } catch (err) {
  console.error("MIDTRANS ERROR:", err)
  res.status(500).json({ error: err.message })
}

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log('Server running on port', PORT)
})
