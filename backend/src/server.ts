// Updated backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'reflect-metadata'; // Required for TypeORM decorators
import { AppDataSource } from './config/database';
import { Hospital } from './models/Hospital';
import { hospitalSchema } from './lib/validations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
  try {
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
    
    // Save to database using TypeORM
    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const hospital = hospitalRepository.create(validatedData);
    await hospitalRepository.save(hospital);
    
    return res.status(201).json({
      success: true,
      message: 'Hôpital créé avec succès',
      data: hospital
    });
  } catch (error) {
    console.error('Error creating hospital:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'hôpital'
    });
  }
});

// Initialize database connection then start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });