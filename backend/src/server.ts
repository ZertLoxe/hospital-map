import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { z } from 'zod';

import { hospitalSchema } from './lib/validations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({   
  origin: ['http://192.168.1.16:3000', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());



app.get('/', (req, res) => {
  res.json({ message: 'Hospital Map API is running' });
});


app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


app.post('/api/add/hospitals/', async (req, res) => {
  
  const validationResult = hospitalSchema.safeParse(req.body);
  
  if (!validationResult.success) {
    const formattedErrors = validationResult.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: formattedErrors
    });
  }
  
  const validatedData = validationResult.data;
  
  // Example: Save to database
  // const hospital = await Hospital.create(validatedData);
  
  return res.status(201).json({
    success: true,
    message: 'Hôpital créé avec succès',
    data: validatedData
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});