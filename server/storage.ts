import { users, places, placeTypes, type User, type InsertUser, type Place, type InsertPlace, type PlaceType, type InsertPlaceType, type PlaceWithType } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, gte, inArray, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  }): Promise<PlaceWithType[]>;
  getPlace(id: number): Promise<PlaceWithType | undefined>;
  createPlace(place: InsertPlace): Promise<Place>;
  updatePlace(id: number, place: Partial<InsertPlace>): Promise<Place | undefined>;
  deletePlace(id: number): Promise<boolean>;
  
  // Stats
  getStats(): Promise<{
    totalPlaces: number;
    visited: number;
    toVisit: number;
  }>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
    return result.rowCount > 0;
  }

  async getPlaces(filters?: {
    typeIds?: number[];
    stateId?: number;
    cityId?: number;
    hasRodizio?: boolean;
    isVisited?: boolean;
    minRating?: number;
    search?: string;
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
        mainImage: places.mainImage,
        itineraryFile: places.itineraryFile,
        rating: places.rating,
        isVisited: places.isVisited,
        tags: places.tags,
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
        mainImage: places.mainImage,
        itineraryFile: places.itineraryFile,
        rating: places.rating,
        isVisited: places.isVisited,
        tags: places.tags,
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

  async createPlace(place: InsertPlace): Promise<Place> {
    const [created] = await db
      .insert(places)
      .values({
        ...place,
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
    return result.rowCount > 0;
  }

  async getStats(): Promise<{
    totalPlaces: number;
    visited: number;
    toVisit: number;
  }> {
    const allPlaces = await db.select().from(places);
    
    const totalPlaces = allPlaces.length;
    const visited = allPlaces.filter(place => place.isVisited === true).length;
    const toVisit = allPlaces.filter(place => place.isVisited === false).length;
    
    return {
      totalPlaces,
      visited,
      toVisit,
    };
  }
}

export const storage = new DatabaseStorage();
