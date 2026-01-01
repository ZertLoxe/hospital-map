import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { DataSource, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { calculateDistance } from "./utils/distance.js";

// ============== ENTITY ==============
@Entity("hospitals")
class Hospital {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column()
  status!: string;

  @Column("decimal", { precision: 10, scale: 7 })
  lat!: number;

  @Column("decimal", { precision: 10, scale: 7 })
  lng!: number;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column("decimal", { precision: 2, scale: 1, nullable: true })
  rating?: number;

  @Column({ default: false })
  is24h!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// Type for hospital with distance
interface HospitalWithDistance extends Omit<Hospital, 'lat' | 'lng' | 'rating'> {
  lat: number;
  lng: number;
  rating?: number;
  distance: number;
}

// ============== DATABASE ==============
const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || "7410"),
  database: process.env.DB_NAME || "hospital_map",
  entities: [Hospital],
  synchronize: true, // Auto-create tables (disable in production)
  logging: true,
});

// ============== EXPRESS APP ==============
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - restrict to specific origins
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map(o => o.trim());
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// ============== ROUTES ==============

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all hospitals
app.get("/api/hospitals", async (_req: Request, res: Response) => {
  try {
    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const hospitals = await hospitalRepository.find();
    res.json(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ error: "Failed to fetch hospitals" });
  }
});

// Search hospitals within radius
app.get("/api/hospitals/search", async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, types } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }

    const refLat = Number.parseFloat(lat as string);
    const refLng = Number.parseFloat(lng as string);
    const searchRadius = Number.parseFloat((radius as string) || "25");
    const typeFilter = types ? (types as string).split(",") : [];

    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const hospitals = await hospitalRepository.find();

    // Calculate distance and filter by radius
    let results: HospitalWithDistance[] = hospitals
      .map((h: Hospital) => ({
        ...h,
        lat: Number.parseFloat(h.lat.toString()),
        lng: Number.parseFloat(h.lng.toString()),
        rating: h.rating ? Number.parseFloat(h.rating.toString()) : undefined,
        distance: calculateDistance(refLat, refLng, Number.parseFloat(h.lat.toString()), Number.parseFloat(h.lng.toString())),
      }))
      .filter((h: HospitalWithDistance) => h.distance <= searchRadius);

    // Filter by types if specified
    if (typeFilter.length > 0) {
      results = results.filter((h: HospitalWithDistance) => typeFilter.includes(h.type));
    }

    // Sort by distance
    results.sort((a: HospitalWithDistance, b: HospitalWithDistance) => a.distance - b.distance);

    res.json(results);
  } catch (error) {
    console.error("Error searching hospitals:", error);
    res.status(500).json({ error: "Failed to search hospitals" });
  }
});

// Get single hospital
app.get("/api/hospitals/:id", async (req: Request, res: Response) => {
  try {
    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const hospital = await hospitalRepository.findOneBy({ id: req.params.id });
    
    if (!hospital) {
      res.status(404).json({ error: "Hospital not found" });
      return;
    }
    
    res.json(hospital);
  } catch (error) {
    console.error("Error fetching hospital:", error);
    res.status(500).json({ error: "Failed to fetch hospital" });
  }
});

// Create hospital
app.post("/api/hospitals", async (req: Request, res: Response) => {
  try {
    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const hospital = hospitalRepository.create(req.body);
    const result = await hospitalRepository.save(hospital);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating hospital:", error);
    res.status(500).json({ error: "Failed to create hospital" });
  }
});

// Update hospital
app.put("/api/hospitals/:id", async (req: Request, res: Response) => {
  try {
    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const hospital = await hospitalRepository.findOneBy({ id: req.params.id });
    
    if (!hospital) {
      res.status(404).json({ error: "Hospital not found" });
      return;
    }
    
    hospitalRepository.merge(hospital, req.body);
    const result = await hospitalRepository.save(hospital);
    res.json(result);
  } catch (error) {
    console.error("Error updating hospital:", error);
    res.status(500).json({ error: "Failed to update hospital" });
  }
});

// Delete hospital
app.delete("/api/hospitals/:id", async (req: Request, res: Response) => {
  try {
    const hospitalRepository = AppDataSource.getRepository(Hospital);
    const result = await hospitalRepository.delete(req.params.id);
    
    if (result.affected === 0) {
      res.status(404).json({ error: "Hospital not found" });
      return;
    }
    
    res.json({ message: "Hospital deleted successfully" });
  } catch (error) {
    console.error("Error deleting hospital:", error);
    res.status(500).json({ error: "Failed to delete hospital" });
  }
});

// ============== START SERVER ==============
async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("📦 Database connected successfully");
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
    
    // Keep the server running
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

startServer();
