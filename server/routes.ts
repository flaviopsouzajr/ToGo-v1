import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPlaceSchema, insertPlaceTypeSchema, insertCarouselImageSchema, passwordResetRequestSchema, passwordResetSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service";
import { randomBytes } from "crypto";




function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Configuração do multer para upload de arquivos de roteiro
const itineraryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/itineraries';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'itinerary-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadItinerary = multer({
  storage: itineraryStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, DOC e DOCX são permitidos para roteiros'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite
  }
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Servir arquivos de roteiro
  app.use('/uploads/itineraries', express.static('./uploads/itineraries'));



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
  app.get("/api/places", requireAuth, async (req, res, next) => {
    try {
      const filters: any = {
        createdBy: req.user.id // Filtrar apenas lugares criados pelo usuário logado
      };
      
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

  app.post("/api/places", requireAuth, uploadItinerary.single('itineraryFile'), async (req, res, next) => {
    try {
      // Converter tipos quando vem FormData (todos chegam como string)
      const processedData = {
        ...req.body,
        typeId: req.body.typeId ? parseInt(req.body.typeId) : undefined,
        stateId: req.body.stateId ? parseInt(req.body.stateId) : undefined,
        cityId: req.body.cityId ? parseInt(req.body.cityId) : undefined,
        hasRodizio: req.body.hasRodizio === 'true',
        rating: req.body.rating ? parseFloat(req.body.rating) : undefined,
        isVisited: req.body.isVisited === 'true',
        tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : []
      };
      
      const validData = insertPlaceSchema.parse(processedData);
      
      // Se um arquivo de roteiro foi enviado, adicionar o caminho
      if (req.file) {
        validData.itineraryFile = `/uploads/itineraries/${req.file.filename}`;
      }
      
      // Obter o ID do usuário logado
      const createdBy = req.user.id;
      
      const place = await storage.createPlace(validData, createdBy);
      res.status(201).json(place);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/places/:id", requireAuth, uploadItinerary.single('itineraryFile'), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating place with ID:", id);
      console.log("Request body:", req.body);
      
      // Converter tipos quando vem FormData (todos chegam como string)
      const processedData = {
        ...req.body,
        typeId: req.body.typeId ? parseInt(req.body.typeId) : undefined,
        stateId: req.body.stateId ? parseInt(req.body.stateId) : undefined,
        cityId: req.body.cityId ? parseInt(req.body.cityId) : undefined,
        hasRodizio: req.body.hasRodizio === 'true' || req.body.hasRodizio === true,
        rating: req.body.rating ? parseFloat(req.body.rating) : undefined,
        isVisited: req.body.isVisited === 'true' || req.body.isVisited === true,
        tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : []
      };
      
      console.log("Processed data:", processedData);
      const validData = insertPlaceSchema.parse(processedData);
      
      // Se um arquivo de roteiro foi enviado, adicionar o caminho
      if (req.file) {
        validData.itineraryFile = `/uploads/itineraries/${req.file.filename}`;
      }
      
      console.log("Validated data:", validData);
      
      const place = await storage.updatePlace(id, validData);
      console.log("Updated place:", place);
      
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }
      
      res.json(place);
    } catch (error) {
      console.error("Error updating place:", error);
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
  app.get("/api/stats", requireAuth, async (req, res, next) => {
    try {
      const stats = await storage.getStats(req.user.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Carousel Images Routes
  app.get("/api/carousel-images", async (req, res, next) => {
    try {
      const images = await storage.getCarouselImages();
      res.json(images);
    } catch (error) {
      next(error);
    }
  });

  // Proxy para imagens do Google Drive
  app.get("/api/proxy-image", async (req, res, next) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      // Fazer a requisição para a URL da imagem
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Copiar headers relevantes
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      // Enviar a imagem
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/carousel-images", requireAdmin, async (req, res, next) => {
    try {
      const validData = insertCarouselImageSchema.parse(req.body);
      const image = await storage.createCarouselImage(validData, req.user.id);
      res.status(201).json(image);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/carousel-images/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validData = insertCarouselImageSchema.parse(req.body);
      const image = await storage.updateCarouselImage(id, validData);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/carousel-images/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCarouselImage(id);
      
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Password Reset Routes
  app.post("/api/password-reset/request", async (req, res, next) => {
    try {
      const validData = passwordResetRequestSchema.parse(req.body);
      const user = await storage.getUserByEmail(validData.email);
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "Se o email existir em nossa base, você receberá as instruções de recuperação." });
      }

      // Generate 6-digit code and unique token
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Clean expired tokens first
      await storage.cleanExpiredTokens();

      // Create reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        code,
        expiresAt,
        isUsed: false,
      });

      // Send email
      const emailSent = await sendPasswordResetEmail({
        to: user.email,
        code,
        username: user.username,
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Erro ao enviar email. Tente novamente." });
      }

      // For development/trial: Log the code to console so we can test
      console.log(`🔐 Código de recuperação para ${user.email}: ${code}`);
      
      res.json({ 
        message: "Se o email existir em nossa base, você receberá as instruções de recuperação.",
        // In development, include the code for testing
        ...(process.env.NODE_ENV === 'development' && { resetCode: code })
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/password-reset/verify", async (req, res, next) => {
    try {
      const validData = passwordResetSchema.parse(req.body);
      const resetToken = await storage.getPasswordResetToken(validData.code);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Código inválido ou expirado." });
      }

      // Get user and update password
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado." });
      }

      // Hash new password (using same method from auth.ts)
      const { scrypt, randomBytes } = require("crypto");
      const { promisify } = require("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = await scryptAsync(validData.newPassword, salt, 64);
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
