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

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    // Extract cookies from the request
    const cookies = req.cookies || {};

    // Extract tokens from cookies
    const accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;

    let userId = null;
    let role = null;

    // Try to verify access token first
    if (accessToken) {
      try {
        const payload = await verifyToken(accessToken);
        userId = payload.userId;
        role = payload.role;
      } catch (error) {
        console.log(
          "Access token verification failed, trying refresh token",
          error
        );

        // If access token failed, try refresh token
        if (refreshToken) {
          try {
            const payload = await verifyToken(refreshToken);
            userId = payload.userId;
            role = payload.role;
          } catch (error) {
            console.error("Both tokens are invalid:", error);
          }
        }
      }
    } else if (refreshToken) {
      // No access token, but we have refresh token
      try {
        const payload = await verifyToken(refreshToken);
        userId = payload.userId;
        role = payload.role;
      } catch (error) {
        console.error("Refresh token verification failed:", error);
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
