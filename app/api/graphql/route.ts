import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { resolvers } from "@/graphql/resolvers";
import { verifyToken } from "@/lib/auth-utils";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Read schema file
const typeDefs = readFileSync(
  join(process.cwd(), "graphql", "schema.graphql"),
  "utf8"
);

// Context type
export interface GraphQLContext {
  prisma: PrismaClient;
  userId: string | null;
  role: string | null;
}

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Handler for Next.js API route
const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    // Extract token from cookies
    const accessToken = req.cookies.accessToken;

    let userId = null;
    let role = null;

    // Try to verify access token
    if (accessToken) {
      try {
        const payload = await verifyToken(accessToken);
        userId = payload.userId;
        role = payload.role;
      } catch (error) {
        // Access token is invalid - don't try to handle it here
        console.error("Access token validation error:", error);
      }
    }

    return {
      prisma,
      userId,
      role,
    };
  },
});

export { handler as GET, handler as POST };
