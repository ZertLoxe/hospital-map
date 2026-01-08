// Merged server.ts - Knex database with your validation endpoints
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import db from "./db"; // Knex instance from dev/Migration
import { hospitalRepository } from "./repositories/hospital.repository";
import { hospitalSchema } from "./lib/validations";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({   
  origin: ['http://192.168.1.16:3000', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hospital Map API is running' });
});

app.get("/health", (_req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Add hospital endpoint with your validation
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
    
    // Convert lat/lng to location format expected by Knex repository
    const hospitalData = {
      name: validatedData.name,
      type: validatedData.type,
      status: validatedData.status,
      location: {
        latitude: validatedData.lat,
        longitude: validatedData.lng
      }
    };
    
    // Save to database using Knex repository
    const hospital = await hospitalRepository.create(hospitalData);
    
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

// Get hospital count
app.get('/api/hospitals/count', async (req, res) => {
  try {
    const count = await hospitalRepository.count();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospital count' });
  }
});

// Get all hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const { type, status, limit, offset } = req.query;
    const filters: { type?: string; status?: string; limit?: number; offset?: number } = {};
    if (type) filters.type = type as string;
    if (status) filters.status = status as string;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);
    const hospitals = await hospitalRepository.findAll(filters);
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospitals' });
  }
});

// Get hospital by ID
app.get('/api/hospitals/:id', async (req, res) => {
  try {
    const hospital = await hospitalRepository.findById(parseInt(req.params.id));
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get hospital' });
  }
});

// Verify DB connectivity and start server (Knex style from dev/Migration)
db.raw("select 1")
  .then(() => {
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error: Error) => {
    console.error("❌ Error during DB initialization:", error);
    process.exit(1);
  });