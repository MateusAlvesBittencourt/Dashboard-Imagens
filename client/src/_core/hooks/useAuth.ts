import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { isLocalMode } from "@/lib/env";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  // 1) Sempre priorize o login local se existir
  let initialLocalUser: any = null;
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("local-auth");
      initialLocalUser = raw ? JSON.parse(raw) : null;
      // espeficicamente pro manus runtime (se usado em outra parte do app)
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(initialLocalUser)
      );
    }
  } catch {}

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // 2) Se já temos login local, não chame o backend
    enabled: !initialLocalUser,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      // Sempre limpe o login local
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("local-auth");
          localStorage.removeItem("manus-runtime-user-info");
        }
      } catch {}
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // 3) Se existir usuário local, ele sempre vence (independente de VITE_LOCAL_MODE)
    if (initialLocalUser) {
      return {
        user: initialLocalUser,
        loading: false,
        error: null,
        isAuthenticated: true,
      } as const;
    }
    // 4) Se estiver em modo local mas sem usuário, continue sem backend
    if (isLocalMode()) {
      return {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      } as const;
    }
    try {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data ?? null)
      );
    } catch {}
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    initialLocalUser,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    // Se houver usuário local, não redireciona
    if (initialLocalUser) return;

    // Em modo local, redireciona para /login caso não esteja logado
    if (isLocalMode()) {
      if (
        !state.user &&
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
      return;
    }

    // Em modo remoto, respeita o status do backend
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
    initialLocalUser,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
