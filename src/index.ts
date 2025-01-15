import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import loginRoutes from './routes/loginRoutes';
import registerRoutes from './routes/registerRoutes';
import { authenticateToken } from './middlewares/authenticateToken';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json({limit: '5mb'}));
// app.use(express.urlencoded({limit: '5mb'}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', cors());
app.use(express.json());
app.use(cookieParser());

app.use('/users', authenticateToken, userRoutes);
app.use('/sing-in', loginRoutes);
app.use('/sing-up', registerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
