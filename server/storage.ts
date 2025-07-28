import { users, places, placeTypes, carouselImages, passwordResetTokens, type User, type InsertUser, type Place, type InsertPlace, type PlaceType, type InsertPlaceType, type PlaceWithType, type CarouselImage, type InsertCarouselImage, type PasswordResetToken, type InsertPasswordResetToken } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, gte, inArray, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Place Types
  getPlaceTypes(): Promise<PlaceType[]>;
  createPlaceType(placeType: InsertPlaceType): Promise<PlaceType>;
  updatePlaceType(id: number, placeType: Partial<InsertPlaceType>): Promise<PlaceType | undefined>;
  deletePlaceType(id: number): Promise<boolean>;
  
  // Places
  getPlaces(filters?: {
    typeIds?: number[];
    stateId?: number;
    cityId?: number;
    hasRodizio?: boolean;
    isVisited?: boolean;
    minRating?: number;
    search?: string;
    createdBy?: number;
  }): Promise<PlaceWithType[]>;
  getPlace(id: number): Promise<PlaceWithType | undefined>;
  createPlace(place: InsertPlace, createdBy: number): Promise<Place>;
  updatePlace(id: number, place: Partial<InsertPlace>): Promise<Place | undefined>;
  deletePlace(id: number): Promise<boolean>;
  
  // Stats
  getStats(userId: number): Promise<{
    totalPlaces: number;
    visited: number;
    toVisit: number;
  }>;
  
  // Carousel Images
  getCarouselImages(): Promise<CarouselImage[]>;
  createCarouselImage(image: InsertCarouselImage, createdBy: number): Promise<CarouselImage>;
  updateCarouselImage(id: number, image: Partial<InsertCarouselImage>): Promise<CarouselImage | undefined>;
  deleteCarouselImage(id: number): Promise<boolean>;
  
  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(code: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(id: number): Promise<boolean>;
  cleanExpiredTokens(): Promise<boolean>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    // Detecta se é email (contém @) ou username
    if (identifier.includes('@')) {
      return this.getUserByEmail(identifier);
    } else {
      return this.getUserByUsername(identifier);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getPlaceTypes(): Promise<PlaceType[]> {
    return await db.select().from(placeTypes).orderBy(placeTypes.name);
  }

  async createPlaceType(placeType: InsertPlaceType): Promise<PlaceType> {
    const [created] = await db
      .insert(placeTypes)
      .values(placeType)
      .returning();
    return created;
  }

  async updatePlaceType(id: number, placeType: Partial<InsertPlaceType>): Promise<PlaceType | undefined> {
    const [updated] = await db
      .update(placeTypes)
      .set(placeType)
      .where(eq(placeTypes.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlaceType(id: number): Promise<boolean> {
    const result = await db.delete(placeTypes).where(eq(placeTypes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPlaces(filters?: {
    typeIds?: number[];
    stateId?: number;
    cityId?: number;
    hasRodizio?: boolean;
    isVisited?: boolean;
    minRating?: number;
    search?: string;
    createdBy?: number;
  }): Promise<PlaceWithType[]> {
    let query = db
      .select({
        id: places.id,
        name: places.name,
        typeId: places.typeId,
        stateId: places.stateId,
        stateName: places.stateName,
        cityId: places.cityId,
        cityName: places.cityName,
        address: places.address,
        description: places.description,
        instagramProfile: places.instagramProfile,
        hasRodizio: places.hasRodizio,
        petFriendly: places.petFriendly,
        mainImage: places.mainImage,
        itineraryFile: places.itineraryFile,
        rating: places.rating,
        isVisited: places.isVisited,
        tags: places.tags,
        createdBy: places.createdBy,
        createdAt: places.createdAt,
        updatedAt: places.updatedAt,
        type: {
          id: placeTypes.id,
          name: placeTypes.name,
          createdAt: placeTypes.createdAt,
        }
      })
      .from(places)
      .innerJoin(placeTypes, eq(places.typeId, placeTypes.id));

    const conditions = [];

    if (filters?.typeIds?.length) {
      conditions.push(inArray(places.typeId, filters.typeIds));
    }
    if (filters?.stateId) {
      conditions.push(eq(places.stateId, filters.stateId));
    }
    if (filters?.cityId) {
      conditions.push(eq(places.cityId, filters.cityId));
    }
    if (filters?.hasRodizio !== undefined) {
      conditions.push(eq(places.hasRodizio, filters.hasRodizio));
    }
    if (filters?.isVisited !== undefined) {
      conditions.push(eq(places.isVisited, filters.isVisited));
    }
    if (filters?.minRating) {
      conditions.push(gte(places.rating, filters.minRating.toString()));
    }
    if (filters?.search) {
      conditions.push(like(places.name, `%${filters.search}%`));
    }
    if (filters?.createdBy) {
      conditions.push(eq(places.createdBy, filters.createdBy));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(places.createdAt));
    
    return results.map(result => ({
      ...result,
      type: result.type as PlaceType
    })) as PlaceWithType[];
  }

  async getPlace(id: number): Promise<PlaceWithType | undefined> {
    const [result] = await db
      .select({
        id: places.id,
        name: places.name,
        typeId: places.typeId,
        stateId: places.stateId,
        stateName: places.stateName,
        cityId: places.cityId,
        cityName: places.cityName,
        address: places.address,
        description: places.description,
        instagramProfile: places.instagramProfile,
        hasRodizio: places.hasRodizio,
        petFriendly: places.petFriendly,
        mainImage: places.mainImage,
        itineraryFile: places.itineraryFile,
        rating: places.rating,
        isVisited: places.isVisited,
        tags: places.tags,
        createdBy: places.createdBy,
        createdAt: places.createdAt,
        updatedAt: places.updatedAt,
        type: {
          id: placeTypes.id,
          name: placeTypes.name,
          createdAt: placeTypes.createdAt,
        }
      })
      .from(places)
      .innerJoin(placeTypes, eq(places.typeId, placeTypes.id))
      .where(eq(places.id, id));

    if (!result) return undefined;

    return {
      ...result,
      type: result.type as PlaceType
    } as PlaceWithType;
  }

  async createPlace(place: InsertPlace, createdBy: number): Promise<Place> {
    const [created] = await db
      .insert(places)
      .values({
        ...place,
        createdBy,
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async updatePlace(id: number, place: Partial<InsertPlace>): Promise<Place | undefined> {
    const [updated] = await db
      .update(places)
      .set({
        ...place,
        updatedAt: new Date(),
      })
      .where(eq(places.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlace(id: number): Promise<boolean> {
    const result = await db.delete(places).where(eq(places.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getStats(userId: number): Promise<{
    totalPlaces: number;
    visited: number;
    toVisit: number;
  }> {
    const allPlaces = await db.select().from(places).where(eq(places.createdBy, userId));
    
    const totalPlaces = allPlaces.length;
    const visited = allPlaces.filter(place => place.isVisited === true).length;
    const toVisit = allPlaces.filter(place => place.isVisited === false).length;
    
    return {
      totalPlaces,
      visited,
      toVisit,
    };
  }

  async getCarouselImages(): Promise<CarouselImage[]> {
    return await db
      .select()
      .from(carouselImages)
      .where(eq(carouselImages.isActive, true))
      .orderBy(carouselImages.displayOrder, carouselImages.createdAt);
  }

  async createCarouselImage(image: InsertCarouselImage, createdBy: number): Promise<CarouselImage> {
    const [newImage] = await db
      .insert(carouselImages)
      .values({ ...image, createdBy })
      .returning();
    return newImage;
  }

  async updateCarouselImage(id: number, image: Partial<InsertCarouselImage>): Promise<CarouselImage | undefined> {
    const [updatedImage] = await db
      .update(carouselImages)
      .set({ ...image, updatedAt: new Date() })
      .where(eq(carouselImages.id, id))
      .returning();
    return updatedImage;
  }

  async deleteCarouselImage(id: number): Promise<boolean> {
    const result = await db
      .delete(carouselImages)
      .where(eq(carouselImages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return newToken;
  }

  async getPasswordResetToken(code: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.code, code),
          eq(passwordResetTokens.isUsed, false),
          gte(passwordResetTokens.expiresAt, new Date())
        )
      );
    return token || undefined;
  }

  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async cleanExpiredTokens(): Promise<boolean> {
    const result = await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.isUsed, false),
          sql`${passwordResetTokens.expiresAt} < NOW()`
        )
      );
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
