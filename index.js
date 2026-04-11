const express = require('express')
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(cors())

console.log("PORT:", process.env.PORT)

app.get('/', (req, res) => {
  res.send('Backend jalan 🚀')
})

app.get('/health', (req, res) => {
  res.send('OK')
})

const PORT = process.env.PORT

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT)
})
