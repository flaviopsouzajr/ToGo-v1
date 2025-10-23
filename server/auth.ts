import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "togo-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'identifier' }, async (identifier, password, done) => {
      try {
        const user = await storage.getUserByIdentifier(identifier);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.status(200).json({ message: "Logout realizado com sucesso" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Get user by ID (for friend profiles)
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without sensitive info
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      next(error);
    }
  });

  // Check username availability and get suggestions
  app.get("/api/check-username/:username", async (req, res, next) => {
    try {
      const { username } = req.params;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ 
          message: "Nome de usuário deve ter pelo menos 3 caracteres" 
        });
      }

      const existingUser = await storage.getUserByUsername(username);
      const isAvailable = !existingUser;

      if (isAvailable) {
        return res.json({ 
          available: true,
          username 
        });
      }

      // Generate suggestions if username is taken
      const suggestions = await generateUsernameSuggestions(username);
      
      res.json({ 
        available: false,
        suggestions 
      });
    } catch (error) {
      next(error);
    }
  });
}

// Helper function to generate username suggestions
async function generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  const currentYear = new Date().getFullYear();
  
  // Remove any existing numbers from the end
  const cleanBase = baseUsername.replace(/\d+$/, '');
  
  // Generate various suggestions
  const potentialSuggestions = [
    `${cleanBase}${currentYear}`,
    `${cleanBase}_togo`,
    `${cleanBase}${Math.floor(Math.random() * 1000)}`,
    `${cleanBase}_${currentYear}`,
    `${cleanBase}${Math.floor(Math.random() * 100)}`,
    `togo_${cleanBase}`,
  ];

  // Check each suggestion and only return available ones
  for (const suggestion of potentialSuggestions) {
    if (suggestions.length >= 4) break; // Limit to 4 suggestions
    
    const existingUser = await storage.getUserByUsername(suggestion);
    if (!existingUser) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}
