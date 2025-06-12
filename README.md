# Next.js GraphQL Authentication & Authorization System

A comprehensive full-stack authentication and authorization system built with **Next.js 15**, **GraphQL**, **PostgreSQL**, and **JWT tokens**.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd nextjs-graphql-auth
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**
   Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nextjs_auth_db"

# JWT Security
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters"
ACCESS_TOKEN_EXPIRY="1h"
REFRESH_TOKEN_EXPIRY="7d"

# Application
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Database Setup**

```bash
# Start PostgreSQL with Docker (optional)
docker-compose up -d

# Run Prisma migrations
npx prisma migrate dev
npx prisma generate

# Seed database with initial users
npm run prisma:seed
```

5. **Start Development Server**

```bash
npm run dev
```

Visit `http://localhost:3000` and use demo accounts:

- **Admin**: `adminU@example.com` / `Admin123`
- **User**: `simpleU@example.com` / `Simple123`

---

## 🔐 Web Security Concepts

### Authentication & Authorization

This project implements **multi-layered security** with JWT tokens and role-based access control:

#### JWT Token Strategy

```typescript
// lib/auth-utils.ts - Dual Token System
export async function generateAccessToken(
  userId: string,
  role: string
): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h") // Short-lived for security
    .sign(getJwtSecretKey());
}

export async function generateRefreshToken(
  userId: string,
  role: string
): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Longer-lived for UX
    .sign(getJwtSecretKey());
}
```

**Security Benefits:**

- ✅ **Short-lived access tokens** (1 hour) minimize exposure
- ✅ **Refresh tokens** (7 days) provide seamless UX
- ✅ **HTTP-only cookies** prevent XSS attacks
- ✅ **Secure & SameSite** flags protect against CSRF

#### Securing Tokens

```typescript
// middleware.ts - Token Validation & Refresh
export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Try access token first, fallback to refresh token
  if (accessToken) {
    try {
      const payload = await verifyToken(accessToken);
      // Valid token - continue
    } catch {
      // Invalid access token - try refresh token
      if (refreshToken) {
        const payload = await verifyToken(refreshToken);
        // Generate new access token seamlessly
        const newAccessToken = await generateAccessToken(
          payload.userId,
          payload.role
        );
        // Set new token in response
      }
    }
  }
}
```

#### Role-Based Authorization

```typescript
// GraphQL Context with Authorization
export interface GraphQLContext {
  prisma: PrismaClient;
  userId: string | null;
  role: string | null; // "USER" | "ADMIN"
}

// Protected resolver example
users: async (_parent: any, _args: any, context: GraphQLContext) => {
  if (!context.userId) {
    throw createAuthenticationError("Authentication required");
  }
  if (context.role !== "ADMIN") {
    throw createForbiddenError("Not authorized to access user list");
  }
  return prisma.user.findMany();
};
```

---

## 🌐 Next.js SSR/SSG Implementation

### Server-Side Authentication

```typescript
// lib/auth.ts - Server-Side User Verification
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  try {
    const { userId } = await verifyToken(accessToken);
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
  } catch {
    return null;
  }
}
```

### Protected Routes with SSR

```typescript
// app/admin/layout.tsx - Server-Side Protection
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
```

### Client-Side Hydration

```typescript
// contexts/AuthContext.tsx - Seamless Client Hydration
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const initAuth = async () => {
      // Skip auth check on public pages
      const pathname = window.location.pathname;
      if (pathname === "/login" || pathname === "/signup") return;

      // Verify server-side auth state on client
      const user = await getUser();
      if (user) {
        dispatch({ type: "AUTH_SUCCESS", payload: user });
      }
    };

    initAuth();
  }, []);
};
```

---

## 🗄️ Database Design (SQL vs NoSQL)

### PostgreSQL Choice (SQL)

```sql
-- prisma/schema.prisma - Relational Data Model
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

**Why PostgreSQL over NoSQL:**

| Aspect                  | PostgreSQL (SQL) ✅                 | MongoDB (NoSQL)          |
| ----------------------- | ----------------------------------- | ------------------------ |
| **ACID Compliance**     | Full ACID transactions              | Limited ACID             |
| **Data Consistency**    | Strong consistency                  | Eventual consistency     |
| **Schema Validation**   | Enforced at DB level                | Application level        |
| **Complex Queries**     | Advanced SQL joins                  | Limited aggregation      |
| **Authentication Data** | Perfect for user/role relationships | Overkill for simple auth |

### Database Security Implementation

```typescript
// lib/prisma-utils.ts - Secure Database Operations
export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: Role = "USER"
) => {
  // Hash password before storage (never store plain text)
  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { name, email, password: hashedPassword, role },
    // Never return password in response
    select: { id: true, name: true, email: true, role: true },
  });
};
```

---

## 📊 GraphQL Implementation

### Type-Safe Schema Design

```graphql
# graphql/schema.graphql
type User {
  id: ID!
  name: String!
  email: String!
  role: String!
}

type AuthPayload {
  token: String!
  accessToken: String!
  refreshToken: String!
  user: User!
}

type Query {
  me: User # Current user
  users: [User!]! # Admin only
  user(id: ID!): User # Self or admin
}

type Mutation {
  login(input: LoginInput!): AuthPayload!
  signup(input: SignupInput!): AuthPayload!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): DeleteUserPayload!
}
```

### Smart Client-Side Caching

```typescript
// lib/apollo-client.ts - Intelligent Cache Management
export const createApolloClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        User: {
          keyFields: ["id"], // Cache by user ID
          fields: {
            role: {
              merge(existing, incoming) {
                return incoming; // Always use latest role
              },
            },
          },
        },
        Query: {
          fields: {
            users: {
              merge(existing = [], incoming) {
                return incoming; // Replace user list completely
              },
            },
          },
        },
      },
    }),
  });
};
```

### Error Handling with Token Refresh

```typescript
// lib/apollo-client.ts - Automatic Token Refresh
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === "UNAUTHENTICATED") {
        return new Observable((observer) => {
          refreshAccessToken().then((success) => {
            if (success) {
              // Retry the failed request with new token
              forward(operation).subscribe(observer);
            } else {
              observer.error(err);
            }
          });
        });
      }
    }
  }
});
```

---

## 🏗️ SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

Each component has one clear purpose:

```typescript
// ✅ Single responsibility - only handles form logic
// hooks/useForm.ts
export function useForm<T>(
  initialValues: T,
  schema: z.ZodType,
  onSubmit: Function
) {
  // Only form state management
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationError>({});
  // ... form-specific logic only
}

// ✅ Single responsibility - only handles validation
// hooks/useFormValidation.ts
export function useFormValidation<T>(schema: z.ZodObject<z.ZodRawShape>) {
  // Only validation logic
  const validateForm = (data: T): boolean => {
    /* ... */
  };
  const validateField = (name: keyof T, value: unknown): boolean => {
    /* ... */
  };
}
```

### 2. Open/Closed Principle (OCP)

Components are open for extension, closed for modification:

```typescript
// ✅ Generic DataTable component - extensible via props
// components/ui/DataTable.tsx
export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick, // ← Extension point
  customActions, // ← Extension point
}: DataTableProps<T>) {
  // Core table logic remains unchanged
  // Extended through configuration, not modification
}

// Usage - extending without modifying core component
const userColumns: Column<User>[] = [
  {
    id: "actions",
    label: "Actions",
    format: (_, row) => (
      <CustomUserActions user={row} /> // ← Extension
    ),
  },
];
```

### 3. Liskov Substitution Principle (LSP)

Derived components can replace base components:

```typescript
// ✅ Base mutation hook
// hooks/useQueryHook.ts
export function useEnhancedMutation<TData, TVariables>(
  mutation: DocumentNode,
  options: MutationOptions
) {
  // Base mutation functionality
}

// ✅ Specialized hooks that are fully substitutable
export function useUserMutation() {
  return useEnhancedMutation(UPDATE_USER_MUTATION, {
    onCompleted: (data) => {
      // User-specific completion logic
    },
  });
}

export function useDeleteMutation() {
  return useEnhancedMutation(DELETE_USER_MUTATION, {
    onCompleted: () => {
      // Delete-specific completion logic
    },
  });
}
```

### 4. Interface Segregation Principle (ISP)

Clients don't depend on interfaces they don't use:

```typescript
// ✅ Segregated interfaces - components only implement what they need
interface BaseFormProps {
  onSubmit: (data: FormData) => void;
}

interface ValidatedFormProps extends BaseFormProps {
  validationSchema: z.ZodSchema;
  onValidationError: (errors: ValidationErrors) => void;
}

interface AuthFormProps extends ValidatedFormProps {
  onAuthSuccess: (user: User) => void;
  onAuthError: (error: string) => void;
}

// ✅ LoginForm only implements auth-specific interface
const LoginForm: React.FC<AuthFormProps> = ({ ... }) => {
  // Only auth-related functionality
};
```

### 5. Dependency Inversion Principle (DIP)

High-level modules don't depend on low-level modules:

```typescript
// ✅ Abstract authentication interface
interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

// ✅ High-level component depends on abstraction
const AuthProvider: React.FC = ({ children }) => {
  // Depends on AuthService interface, not concrete implementation
  const authService = useAuthService(); // ← Injected dependency
};

// ✅ Concrete implementations
class JWTAuthService implements AuthService {
  async login(credentials: LoginCredentials) {
    // JWT-specific implementation
  }
}

class OAuth2AuthService implements AuthService {
  async login(credentials: LoginCredentials) {
    // OAuth2-specific implementation
  }
}
```

---

## 🛠️ Development Tools

### Apollo DevTools Integration

```typescript
// lib/apollo-client.ts - Development Experience
export const createApolloClient = () => {
  return new ApolloClient({
    // Enable DevTools in development
    connectToDevTools: process.env.NODE_ENV === "development",
    name: "Next.js GraphQL Auth Client",

    // Enhanced debugging
    defaultOptions: {
      watchQuery: {
        errorPolicy: "all",
        notifyOnNetworkStatusChange: true,
      },
    },
  });
};
```

## 🏛️ Architecture Decisions

### Security Considerations

- ✅ **No client-side token storage** (prevents XSS)
- ✅ **Automatic token rotation** (minimizes breach impact)
- ✅ **Role-based authorization** (principle of least privilege)
- ✅ **Input validation** (Zod schemas prevent injection)
- ✅ **Password hashing** (bcrypt with salt rounds)
- ✅ **HTTPS enforcement** (production security)

---

## 📚 Key Learning Outcomes

This project demonstrates proficiency in:

- 🔐 **Modern Authentication**: JWT tokens, refresh strategies, secure storage
- 🌐 **Full-Stack Next.js**: SSR/SSG, API routes, middleware
- 📊 **GraphQL**: Schema design, resolvers, client-side caching
- 🗄️ **Database Design**: Relational modeling, migrations, security
- 🏗️ **Clean Architecture**: SOLID principles, separation of concerns
- 🧪 **Developer Experience**: TypeScript, tooling, debugging

---
