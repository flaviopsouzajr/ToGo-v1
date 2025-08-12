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
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";




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
      const filters: any = {};
      
      // Sempre filtrar pelos lugares criados pelo usuário logado
      // Não mostrar lugares clonados por outros usuários
      filters.createdBy = req.user!.id;
      
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
      const stats = await storage.getStats(req.user!.id);
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

  // Proxy para imagens do Google Drive e Cloud Storage
  app.get("/api/proxy-image", async (req, res, next) => {
    try {
      const { url, format } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      console.log("Proxy request for URL:", url, "format:", format);

      // Fazer a requisição para a URL da imagem
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log("Proxy response not ok:", response.status, response.statusText);
        return res.status(404).json({ message: "Image not found" });
      }

      // Get buffer
      const buffer = await response.arrayBuffer();
      console.log("Proxy successful, buffer size:", buffer.byteLength);

      // If requesting base64 format, return as JSON
      if (format === 'base64') {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.json({ dataUrl });
      }

      // Otherwise, return binary image
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      // Add CORS headers for cropper compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Proxy error:", error);
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

      // Try to send email, but don't fail if email service has issues
      let emailSent = false;
      try {
        emailSent = await sendPasswordResetEmail({
          to: user.email,
          code,
          username: user.username,
        });
      } catch (error) {
        console.error('Email service error:', error);
      }

      // For development/trial: Always log the code to console for testing
      console.log(`🔐 Código de recuperação para ${user.email}: ${code}`);
      
      res.json({ 
        message: "Se o email existir em nossa base, você receberá as instruções de recuperação.",
        // In development, include the code for testing
        ...(process.env.NODE_ENV === 'development' && { resetCode: code }),
        // Also indicate if email was sent successfully
        ...(process.env.NODE_ENV === 'development' && { emailSent })
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
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = await scryptAsync(validData.newPassword, salt, 64) as Buffer;
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

  // Friends routes
  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const friends = await storage.getFriends(req.user!.id);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/search-users", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const users = await storage.searchUsers(q, req.user.id);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/friends", requireAuth, async (req, res) => {
    try {
      const { friendId } = req.body;
      if (!friendId || typeof friendId !== 'number') {
        return res.status(400).json({ message: "Friend ID is required" });
      }

      // Check if already friends
      const isAlreadyFriend = await storage.isFriend(req.user.id, friendId);
      if (isAlreadyFriend) {
        return res.status(400).json({ message: "User is already a friend" });
      }

      // Check if trying to add themselves
      if (req.user.id === friendId) {
        return res.status(400).json({ message: "Cannot add yourself as friend" });
      }

      const friendship = await storage.addFriend(req.user.id, friendId);
      res.json(friendship);
    } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).json({ message: "Failed to add friend" });
    }
  });

  app.delete("/api/friends/:friendId", requireAuth, async (req, res) => {
    try {
      const friendId = parseInt(req.params.friendId);
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }

      const success = await storage.removeFriend(req.user.id, friendId);
      if (!success) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      res.json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  app.get("/api/friends/:friendId/recommendations", requireAuth, async (req, res) => {
    try {
      const friendId = parseInt(req.params.friendId);
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }

      // Check if user is actually following this friend
      const isFriend = await storage.isFriend(req.user.id, friendId);
      if (!isFriend) {
        return res.status(403).json({ message: "You can only view recommendations from your friends" });
      }

      const recommendations = await storage.getFriendRecommendations(friendId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching friend recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Clone place from friend
  app.post("/api/places/:placeId/clone", requireAuth, async (req, res) => {
    try {
      const placeId = parseInt(req.params.placeId);
      if (isNaN(placeId)) {
        return res.status(400).json({ message: "Invalid place ID" });
      }

      const clonedPlace = await storage.clonePlace(placeId, req.user.id);
      res.json(clonedPlace);
    } catch (error) {
      console.error("Error cloning place:", error);
      
      // Check for specific error types and provide user-friendly messages
      if (error instanceof Error) {
        if (error.message === "You have already cloned a place from this user") {
          return res.status(409).json({ 
            message: "Você já clonou este lugar deste amigo." 
          });
        }
        if (error.message === "Place not found") {
          return res.status(404).json({ 
            message: "Este lugar não foi encontrado ou não está mais disponível." 
          });
        }
      }
      
      res.status(500).json({ message: "Não foi possível clonar o lugar. Tente novamente mais tarde." });
    }
  });

  // Profile update endpoint
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, email } = req.body;
      
      // Validate email format if provided
      if (email && !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
      }

      // Only update name and email, not profile picture (separate endpoint)
      const updateData: Partial<{ name: string; email: string }> = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      const updatedUser = await storage.updateUser(req.user!.id, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Remove password from response
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Falha ao atualizar perfil" });
    }
  });

  // Object storage endpoints for profile pictures
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const ObjectStorageService = (await import("./objectStorage")).ObjectStorageService;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      const { ObjectNotFoundError } = await import("./objectStorage");
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const ObjectStorageService = (await import("./objectStorage")).ObjectStorageService;
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Falha ao gerar URL de upload" });
    }
  });

  app.put("/api/profile-picture", requireAuth, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ message: "URL da imagem é obrigatória" });
      }

      console.log("Received imageUrl for profile picture:", imageUrl);

      try {
        const ObjectStorageService = (await import("./objectStorage")).ObjectStorageService;
        const objectStorageService = new ObjectStorageService();
        
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          imageUrl,
          {
            owner: req.user!.id.toString(),
            visibility: "public"
          }
        );

        console.log("Generated object path:", objectPath);

        // Update user profile picture in database
        const updatedUser = await storage.updateUser(req.user!.id, {
          profilePictureUrl: objectPath
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Remove password from response and include the normalized path
        const { password, ...userResponse } = updatedUser;
        res.json({
          ...userResponse,
          profilePictureUrl: objectPath
        });
      } catch (objectError) {
        console.error("Object storage error:", objectError);
        // Fallback: save the URL directly if object storage fails
        const updatedUser = await storage.updateUser(req.user!.id, {
          profilePictureUrl: imageUrl
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Remove password from response (fallback case)
        const { password, ...userResponse } = updatedUser;
        res.json({
          ...userResponse,
          profilePictureUrl: imageUrl
        });
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Falha ao atualizar foto de perfil" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
