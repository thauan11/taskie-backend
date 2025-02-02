import express from 'express'
import cors from 'cors'
import userRoutes from './routes/userRoutes'
import loginRoutes from './routes/loginRoutes'
import registerRoutes from './routes/registerRoutes'
import { authenticateToken } from './middlewares/authenticateToken'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cookieParser())

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
  })
)

app.use(express.json({ limit: '5mb' }))

app.use('/users', authenticateToken, userRoutes)
app.use('/auth', loginRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
)
