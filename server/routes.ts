import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPlaceSchema, insertPlaceTypeSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "mainImage") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed for main image"));
      }
    } else if (file.fieldname === "itineraryFile") {
      if (file.mimetype === "application/pdf" || 
          file.mimetype.includes("document") ||
          file.mimetype.includes("word")) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF and document files are allowed for itinerary"));
      }
    } else {
      cb(null, true);
    }
  },
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Place Types Routes
  app.get("/api/place-types", async (req, res, next) => {
    try {
      const placeTypes = await storage.getPlaceTypes();
      res.json(placeTypes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/place-types", requireAuth, async (req, res, next) => {
    try {
      const validData = insertPlaceTypeSchema.parse(req.body);
      const placeType = await storage.createPlaceType(validData);
      res.status(201).json(placeType);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/place-types/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertPlaceTypeSchema.partial().parse(req.body);
      const placeType = await storage.updatePlaceType(id, validData);
      
      if (!placeType) {
        return res.status(404).json({ message: "Place type not found" });
      }
      
      res.json(placeType);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/place-types/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlaceType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Place type not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Places Routes
  app.get("/api/places", async (req, res, next) => {
    try {
      const filters: any = {};
      
      if (req.query.typeIds) {
        filters.typeIds = Array.isArray(req.query.typeIds) 
          ? req.query.typeIds.map(id => parseInt(id as string))
          : [parseInt(req.query.typeIds as string)];
      }
      
      if (req.query.stateId) filters.stateId = parseInt(req.query.stateId as string);
      if (req.query.cityId) filters.cityId = parseInt(req.query.cityId as string);
      if (req.query.hasRodizio) filters.hasRodizio = req.query.hasRodizio === "true";
      if (req.query.isVisited) filters.isVisited = req.query.isVisited === "true";
      if (req.query.minRating) filters.minRating = parseFloat(req.query.minRating as string);
      if (req.query.search) filters.search = req.query.search as string;

      const places = await storage.getPlaces(filters);
      res.json(places);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/places/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const place = await storage.getPlace(id);
      
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }
      
      res.json(place);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/places", requireAuth, upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "itineraryFile", maxCount: 1 }
  ]), async (req, res, next) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const data = { ...req.body };

      // Handle file uploads
      if (files?.mainImage?.[0]) {
        data.mainImage = `/uploads/${files.mainImage[0].filename}`;
      }
      
      if (files?.itineraryFile?.[0]) {
        data.itineraryFile = `/uploads/${files.itineraryFile[0].filename}`;
      }

      // Convert string values to appropriate types
      if (data.typeId) data.typeId = parseInt(data.typeId);
      if (data.stateId) data.stateId = parseInt(data.stateId);
      if (data.cityId) data.cityId = parseInt(data.cityId);
      if (data.hasRodizio) data.hasRodizio = data.hasRodizio === "true";
      if (data.isVisited) data.isVisited = data.isVisited === "true";
      if (data.rating) data.rating = parseFloat(data.rating);

      const validData = insertPlaceSchema.parse(data);
      const place = await storage.createPlace(validData);
      res.status(201).json(place);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/places/:id", requireAuth, upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "itineraryFile", maxCount: 1 }
  ]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const data = { ...req.body };

      // Handle file uploads
      if (files?.mainImage?.[0]) {
        data.mainImage = `/uploads/${files.mainImage[0].filename}`;
      }
      
      if (files?.itineraryFile?.[0]) {
        data.itineraryFile = `/uploads/${files.itineraryFile[0].filename}`;
      }

      // Convert string values to appropriate types
      if (data.typeId) data.typeId = parseInt(data.typeId);
      if (data.stateId) data.stateId = parseInt(data.stateId);
      if (data.cityId) data.cityId = parseInt(data.cityId);
      if (data.hasRodizio) data.hasRodizio = data.hasRodizio === "true";
      if (data.isVisited) data.isVisited = data.isVisited === "true";
      if (data.rating) data.rating = parseFloat(data.rating);

      const validData = insertPlaceSchema.partial().parse(data);
      const place = await storage.updatePlace(id, validData);
      
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }
      
      res.json(place);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/places/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlace(id);
      
      if (!success) {
        return res.status(404).json({ message: "Place not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Stats Route
  app.get("/api/stats", async (req, res, next) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
