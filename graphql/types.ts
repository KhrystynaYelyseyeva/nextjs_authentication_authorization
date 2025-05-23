import { gql } from "@apollo/client";

// =====================
// Type Definitions
// =====================
export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface DeleteUserPayload {
  success: boolean;
  message: string;
}

// =====================
// Query Types
// =====================
export interface MeQueryResult {
  me: User | null;
}

export interface UsersQueryResult {
  users: User[];
}

export interface UserQueryResult {
  user: User;
}

// =====================
// Mutation Types
// =====================
export interface LoginMutationResult {
  login: AuthPayload;
}

export interface SignupMutationResult {
  signup: AuthPayload;
}

export interface UpdateUserMutationResult {
  updateUser: User;
}

export interface DeleteUserMutationResult {
  deleteUser: DeleteUserPayload;
}

// =====================
// GraphQL Documents
// =====================

// Query Documents
export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`;

export const USERS_QUERY = gql`
  query Users {
    users {
      id
      name
      email
      role
    }
  }
`;

export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
    }
  }
`;

// Mutation Documents
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      role
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;
