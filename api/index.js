const express = require('express')
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Backend jalan 🚀')
})

app.get('/health', (req, res) => {
  res.send('OK')
})

// ✅ fallback HARUS ADA
const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT)
})
