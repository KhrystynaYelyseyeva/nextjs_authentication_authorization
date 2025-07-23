import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { resolvers } from "@/graphql/resolvers";
import { verifyToken } from "@/lib/auth-utils";
import { NextRequest } from "next/server";

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
  context: async (req: NextRequest) => {
    let userId = null;
    let role = null;

    try {
      // Get tokens from cookies using the NextRequest cookies API
      const accessToken = req.cookies.get("accessToken")?.value;
      const refreshToken = req.cookies.get("refreshToken")?.value;

      // Try to verify access token first
      if (accessToken) {
        try {
          const payload = await verifyToken(accessToken);
          userId = payload.userId;
          role = payload.role;
        } catch (error) {
          console.error(
            "GraphQL Context - Access token verification failed:",
            error
          );

          // If access token failed, try refresh token
          if (refreshToken) {
            try {
              const payload = await verifyToken(refreshToken);
              userId = payload.userId;
              role = payload.role;
            } catch (refreshError) {
              console.error(
                "GraphQL Context - Both tokens are invalid:",
                refreshError
              );
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
          console.error(
            "GraphQL Context - Refresh token verification failed:",
            error
          );
        }
      } else {
        console.log("GraphQL Context - No tokens found in cookies");
      }
    } catch (error) {
      console.error("GraphQL Context - Unexpected error:", error);
    }

    return {
      prisma,
      userId,
      role,
    };
  },
});

export { handler as GET, handler as POST };
