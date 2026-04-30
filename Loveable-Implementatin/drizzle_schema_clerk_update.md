# Drizzle Schema Update for Clerk Auth

Since you are using Clerk, you should not store passwords in your database.

Clerk will manage:
- signup
- login
- sessions
- password reset
- email verification
- OAuth providers
- user identity

Your database only needs to store Clerk's user ID and any extra profile/project-related data.

---

## Updated `users` table

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Clerk user ID
  clerkUserId: text("clerk_user_id").notNull().unique(),

  name: text("name"),
  email: text("email").notNull(),

  imageUrl: text("image_url"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

---

## Important change

Remove this old field:

```ts
passwordHash: text("password_hash").notNull(),
```

You do not need it anymore because Clerk handles passwords.

---

## Recommended Clerk user sync flow

When a user signs in for the first time:

1. Clerk authenticates the user
2. Next.js checks if that Clerk user already exists in your DB
3. If not, create a new user row
4. Save:
   - clerk user id
   - email
   - name
   - image url

Example flow:

```ts
const existingUser = await db.query.users.findFirst({
  where: eq(users.clerkUserId, clerkUser.id),
});

if (!existingUser) {
  await db.insert(users).values({
    clerkUserId: clerkUser.id,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
    imageUrl: clerkUser.imageUrl,
  });
}
```

---

## Recommended helper function

```ts
export async function getCurrentDbUser(clerkUserId: string) {
  return await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
}
```

---

## Recommended relation usage

All your other tables should still reference your internal `users.id`, not Clerk's ID directly.

Example:

```ts
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull(),
  status: text("status").notNull().default("active"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

This is better because:
- your DB stays independent from Clerk internals
- easier future migration
- cleaner foreign key relationships
- smaller indexes
