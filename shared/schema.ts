import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
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
  mainImage: text("main_image"),
  itineraryFile: text("itinerary_file"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  isVisited: boolean("is_visited").default(false),
  tags: text("tags").array(),
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

export const placesRelations = relations(places, ({ one }) => ({
  type: one(placeTypes, {
    fields: [places.typeId],
    references: [placeTypes.id],
  }),
  createdByUser: one(users, {
    fields: [places.createdBy],
    references: [users.id],
  }),
}));

export const placeTypesRelations = relations(placeTypes, ({ many }) => ({
  places: many(places),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdPlaces: many(places),
  carouselImages: many(carouselImages),
}));

export const carouselImagesRelations = relations(carouselImages, ({ one }) => ({
  createdByUser: one(users, {
    fields: [carouselImages.createdBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
}).extend({
  rating: z.number().min(0).max(5).optional(),
});

export const insertCarouselImageSchema = createInsertSchema(carouselImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlaceType = z.infer<typeof insertPlaceTypeSchema>;
export type PlaceType = typeof placeTypes.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect;
export type PlaceWithType = Place & { type: PlaceType; createdByUser?: User };
export type InsertCarouselImage = z.infer<typeof insertCarouselImageSchema>;
export type CarouselImage = typeof carouselImages.$inferSelect;
