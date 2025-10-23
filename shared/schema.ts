import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  profilePictureUrl: text("profile_picture_url"),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const placeTypes = pgTable("place_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  typeId: integer("type_id").notNull().references(() => placeTypes.id),
  stateId: integer("state_id").notNull(),
  stateName: text("state_name").notNull(),
  cityId: integer("city_id").notNull(),
  cityName: text("city_name").notNull(),
  address: text("address"),
  description: text("description"),
  instagramProfile: text("instagram_profile"),
  hasRodizio: boolean("has_rodizio").default(false),
  petFriendly: boolean("pet_friendly").default(false),
  recommendToFriends: boolean("recommend_to_friends").default(false),
  mainImage: text("main_image"),
  mainImageThumb: text("main_image_thumb"),
  itineraryFile: text("itinerary_file"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  isVisited: boolean("is_visited").default(false),
  tags: text("tags").array(),
  isClone: boolean("is_clone").default(false),
  clonedFromUserId: integer("cloned_from_user_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const carouselImages = pgTable("carousel_images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  friendId: integer("friend_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'nova_indicacao', 'nova_avaliacao', 'alteracao_avaliacao'
  placeId: integer("place_id").references(() => places.id),
  oldRating: decimal("old_rating", { precision: 2, scale: 1 }),
  newRating: decimal("new_rating", { precision: 2, scale: 1 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const placesRelations = relations(places, ({ one }) => ({
  type: one(placeTypes, {
    fields: [places.typeId],
    references: [placeTypes.id],
  }),
  createdByUser: one(users, {
    fields: [places.createdBy],
    references: [users.id],
  }),
  clonedFromUser: one(users, {
    fields: [places.clonedFromUserId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [activities.placeId],
    references: [places.id],
  }),
}));

export const placeTypesRelations = relations(placeTypes, ({ many }) => ({
  places: many(places),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdPlaces: many(places),
  carouselImages: many(carouselImages),
  activities: many(activities),
}));

export const carouselImagesRelations = relations(carouselImages, ({ one }) => ({
  createdByUser: one(users, {
    fields: [carouselImages.createdBy],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
}).extend({
  email: z.string().email("Email deve ter um formato válido"),
  name: z.string().min(1, "Nome é obrigatório"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Nome de usuário ou email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Email deve ter um formato válido"),
});

export const passwordResetSchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const insertPlaceTypeSchema = createInsertSchema(placeTypes).omit({
  id: true,
  createdAt: true,
});

export const insertPlaceSchema = createInsertSchema(places).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  isClone: true,
  clonedFromUserId: true,
}).extend({
  rating: z.number().min(0).max(5).multipleOf(0.5).optional(),
});

export const insertCarouselImageSchema = createInsertSchema(carouselImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlaceType = z.infer<typeof insertPlaceTypeSchema>;
export type PlaceType = typeof placeTypes.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect;
export type PlaceWithType = Place & { type: PlaceType; createdByUser?: User };
export type InsertCarouselImage = z.infer<typeof insertCarouselImageSchema>;
export type CarouselImage = typeof carouselImages.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type FriendWithUser = Friendship & { friend: User };

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type ActivityWithDetails = Activity & { 
  user: User; 
  place?: Place & { type: PlaceType }; 
};
