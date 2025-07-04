import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const placesRelations = relations(places, ({ one }) => ({
  type: one(placeTypes, {
    fields: [places.typeId],
    references: [placeTypes.id],
  }),
}));

export const placeTypesRelations = relations(placeTypes, ({ many }) => ({
  places: many(places),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlaceType = z.infer<typeof insertPlaceTypeSchema>;
export type PlaceType = typeof placeTypes.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect;
export type PlaceWithType = Place & { type: PlaceType };
