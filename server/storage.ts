import { users, places, placeTypes, carouselImages, passwordResetTokens, friendships, activities, type User, type InsertUser, type Place, type InsertPlace, type PlaceType, type InsertPlaceType, type PlaceWithType, type CarouselImage, type InsertCarouselImage, type PasswordResetToken, type InsertPasswordResetToken, type Friendship, type InsertFriendship, type FriendWithUser, type Activity, type InsertActivity, type ActivityWithDetails } from "@shared/schema";
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
  updateUser(id: number, data: Partial<InsertUser & { name?: string; profilePictureUrl?: string }>): Promise<User | undefined>;
  
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
  
  // Friendships
  getFriends(userId: number): Promise<FriendWithUser[]>;
  searchUsers(query: string, excludeUserId: number): Promise<User[]>;
  addFriend(userId: number, friendId: number): Promise<Friendship>;
  removeFriend(userId: number, friendId: number): Promise<boolean>;
  isFriend(userId: number, friendId: number): Promise<boolean>;
  getFriendRecommendations(friendId: number): Promise<PlaceWithType[]>;
  clonePlace(placeId: number, userId: number): Promise<Place>;

  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  getFriendsActivities(userId: number, limit?: number, offset?: number): Promise<ActivityWithDetails[]>;
  
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

  async updateUser(id: number, data: Partial<InsertUser & { name?: string; profilePictureUrl?: string }>): Promise<User | undefined> {
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
        recommendToFriends: places.recommendToFriends,
        mainImage: places.mainImage,
        itineraryFile: places.itineraryFile,
        rating: places.rating,
        isVisited: places.isVisited,
        tags: places.tags,
        isClone: places.isClone,
        clonedFromUserId: places.clonedFromUserId,
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
        recommendToFriends: places.recommendToFriends,
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
    // Convert rating to string if it's a number
    const processedData = {
      ...place,
      rating: typeof place.rating === 'number' ? place.rating.toString() : place.rating,
      updatedAt: new Date()
    };

    const [updated] = await db
      .update(places)
      .set(processedData)
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

  // Friendship methods
  async getFriends(userId: number): Promise<FriendWithUser[]> {
    const results = await db
      .select({
        id: friendships.id,
        userId: friendships.userId,
        friendId: friendships.friendId,
        createdAt: friendships.createdAt,
        friend: {
          id: users.id,
          username: users.username,
          email: users.email,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        }
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(eq(friendships.userId, userId))
      .orderBy(desc(friendships.createdAt));

    return results.map(result => ({
      ...result,
      friend: result.friend as User
    })) as FriendWithUser[];
  }

  async searchUsers(query: string, excludeUserId: number): Promise<User[]> {
    const results = await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.id} != ${excludeUserId}`,
          sql`(${users.username} ILIKE ${`%${query}%`} OR ${users.email} ILIKE ${`%${query}%`})`
        )
      )
      .limit(10);
    
    return results;
  }

  async addFriend(userId: number, friendId: number): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({ userId, friendId })
      .returning();
    return friendship;
  }

  async removeFriend(userId: number, friendId: number): Promise<boolean> {
    const result = await db
      .delete(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
    return (result.rowCount ?? 0) > 0;
  }

  async isFriend(userId: number, friendId: number): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)))
      .limit(1);
    return !!friendship;
  }

  async getFriendRecommendations(friendId: number): Promise<PlaceWithType[]> {
    const results = await db
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
        recommendToFriends: places.recommendToFriends,
        mainImage: places.mainImage,
        itineraryFile: places.itineraryFile,
        rating: places.rating,
        isVisited: places.isVisited,
        tags: places.tags,
        isClone: places.isClone,
        clonedFromUserId: places.clonedFromUserId,
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
      .where(and(
        eq(places.createdBy, friendId),
        eq(places.recommendToFriends, true)
      ))
      .orderBy(desc(places.createdAt));
    
    return results.map(result => ({
      ...result,
      type: result.type as PlaceType
    })) as PlaceWithType[];
  }

  async clonePlace(placeId: number, userId: number): Promise<Place> {
    // First, get the original place
    const originalPlace = await this.getPlace(placeId);
    if (!originalPlace) {
      throw new Error("Place not found");
    }

    // Check if user already cloned this specific place
    const existingClone = await db
      .select()
      .from(places)
      .where(
        and(
          eq(places.createdBy, userId),
          eq(places.isClone, true),
          eq(places.name, originalPlace.name),
          eq(places.clonedFromUserId, originalPlace.createdBy || 0)
        )
      )
      .limit(1);

    if (existingClone.length > 0) {
      throw new Error("You have already cloned this specific place");
    }

    // Create clone with modified data
    const cloneData = {
      name: originalPlace.name,
      typeId: originalPlace.typeId,
      stateId: originalPlace.stateId,
      stateName: originalPlace.stateName,
      cityId: originalPlace.cityId,
      cityName: originalPlace.cityName,
      address: originalPlace.address,
      description: originalPlace.description,
      instagramProfile: originalPlace.instagramProfile,
      hasRodizio: originalPlace.hasRodizio,
      petFriendly: originalPlace.petFriendly,
      recommendToFriends: false, // Reset to false for clone
      mainImage: originalPlace.mainImage,
      itineraryFile: originalPlace.itineraryFile,
      rating: "0", // Reset rating
      isVisited: false, // Reset visit status
      tags: originalPlace.tags,
      isClone: true,
      clonedFromUserId: originalPlace.createdBy,
      createdBy: userId,
    };

    const [clonedPlace] = await db
      .insert(places)
      .values(cloneData)
      .returning();

    return clonedPlace;
  }

  // Activity methods
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getFriendsActivities(userId: number, limit: number = 20, offset: number = 0): Promise<ActivityWithDetails[]> {
    // Get user's friends first
    const userFriends = await db
      .select({ friendId: friendships.friendId })
      .from(friendships)
      .where(eq(friendships.userId, userId));

    const friendIds = userFriends.map(f => f.friendId);

    if (friendIds.length === 0) {
      return [];
    }

    // Get activities from friends
    const results = await db
      .select({
        id: activities.id,
        userId: activities.userId,
        type: activities.type,
        placeId: activities.placeId,
        oldRating: activities.oldRating,
        newRating: activities.newRating,
        createdAt: activities.createdAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          name: users.name,
          profilePictureUrl: users.profilePictureUrl,
          password: users.password,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        },
        place: {
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
          recommendToFriends: places.recommendToFriends,
          mainImage: places.mainImage,
          itineraryFile: places.itineraryFile,
          rating: places.rating,
          isVisited: places.isVisited,
          tags: places.tags,
          isClone: places.isClone,
          clonedFromUserId: places.clonedFromUserId,
          createdBy: places.createdBy,
          createdAt: places.createdAt,
          updatedAt: places.updatedAt,
          type: {
            id: placeTypes.id,
            name: placeTypes.name,
            createdAt: placeTypes.createdAt,
          }
        }
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .leftJoin(places, eq(activities.placeId, places.id))
      .leftJoin(placeTypes, eq(places.typeId, placeTypes.id))
      .where(inArray(activities.userId, friendIds))
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      ...result,
      user: result.user as User,
      place: result.place ? {
        ...result.place,
        type: result.place.type as PlaceType
      } as Place & { type: PlaceType } : undefined
    })) as ActivityWithDetails[];
  }

  sessionStore = new PostgresSessionStore({
    pool: pool,
    tableName: 'session'
  });
}

export const storage = new DatabaseStorage();
