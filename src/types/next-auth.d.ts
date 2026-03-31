import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      address?: Record<string, string> | null;
      createdAt?: string;
      dislikes?: string[];
      email: string;
      interests?: string[];
      name: string;
      phone?: string | null;
      role?: string;
      travelerType?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
