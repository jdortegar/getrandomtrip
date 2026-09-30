import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { configureAuthEnvironment } from "@/lib/auth/environment";
import {
  getAuthSecret,
  getNonproductionOrigin,
  isProductionDeployment,
} from "@/lib/deployment";

const nextAuthHandler = NextAuth(authOptions);

function handler(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  configureAuthEnvironment();
  if (
    !isProductionDeployment() &&
    (!getAuthSecret() || !getNonproductionOrigin())
  ) {
    return Response.json(
      { error: "Nonproduction authentication is not configured" },
      { status: 503 },
    );
  }
  return nextAuthHandler(request, context);
}

export { handler as GET, handler as POST };
