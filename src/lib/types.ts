import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: Role[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
  }
}
