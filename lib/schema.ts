import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const sourceTypeEnum = pgEnum('source_type', ['tiktok', 'instagram', 'blog'])
export const categoryEnum = pgEnum('category', ['snacks', 'breakfast', 'lunch_dinner', 'desserts', 'drinks'])
export const tierEnum = pgEnum('tier', ['S', 'A', 'B', 'C', 'D', 'E'])

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  sourceUrl: text('source_url'),
  sourceType: sourceTypeEnum('source_type'),
  category: categoryEnum('category'),
  tier: tierEnum('tier'),
  review: text('review'),
  photoUrl: text('photo_url'),
  ingredients: jsonb('ingredients').$type<string[]>().default([]),
  steps: jsonb('steps').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tweaks = pgTable('tweaks', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type Tweak = typeof tweaks.$inferSelect
export type NewTweak = typeof tweaks.$inferInsert
