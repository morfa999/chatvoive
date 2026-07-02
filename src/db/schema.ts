import { pgTable, text, timestamp, integer, varchar } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  socketId: text("socket_id").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  connectedTo: text("connected_to"),
  status: varchar("status", { length: 20 }).default("waiting"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const stats = pgTable("stats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  totalConnections: integer("total_connections").default(0),
  totalSkips: integer("total_skips").default(0),
  activeUsers: integer("active_users").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});
