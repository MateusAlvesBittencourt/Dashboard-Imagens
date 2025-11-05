import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Verifica se está em modo local
const isLocalMode = () => {
  return process.env.NODE_ENV !== "production" || 
         !process.env.VITE_APP_ID || 
         process.env.VITE_LOCAL_MODE === "true";
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Em modo local, não tenta autenticar via OAuth
  if (isLocalMode()) {
    // Verifica se há usuário local no localStorage (via cookie se possível)
    // Mas como estamos no servidor, não temos acesso ao localStorage
    // Então retorna null e deixa as rotas públicas funcionarem
    return {
      req: opts.req,
      res: opts.res,
      user: null,
    };
  }

  // Em modo produção, tenta autenticar
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
