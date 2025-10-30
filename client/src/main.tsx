import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import { isLocalMode } from "./lib/env";
import { localdb } from "./lib/localdb";
import { observable } from "@trpc/server/observable";
import type { TRPCLink } from "@trpc/client";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Em modo local não usamos OAuth; redireciona para /login
  if (isLocalMode()) {
    window.location.href = "/login";
    return;
  }
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Link local: roteia chamadas para o localdb
const hasLocalAuth = () => {
  try {
    return Boolean(localStorage.getItem('local-auth'));
  } catch {
    return false;
  }
};

const localLink: TRPCLink<any> = () => ({ op, next }) => {
  if (!(isLocalMode() || hasLocalAuth())) return next(op);
  return observable((observer: any) => {
    try {
      const { path, input, type } = op;
      // mapear rotas mínimas usadas no front
      if (type === 'query') {
        if (path === 'academicUnits.list') {
          observer.next({ result: { data: localdb.listUnits() as any } });
          observer.complete();
          return;
        }
        if (path === 'laboratories.list') {
          observer.next({ result: { data: localdb.listLabs() as any } });
          observer.complete();
          return;
        }
        if (path === 'software.getByLaboratory') {
          const { laboratoryId } = (input as any) ?? {};
          observer.next({ result: { data: localdb.listSoftwareByLab(Number(laboratoryId)) as any } });
          observer.complete();
          return;
        }
        if (path === 'machines.getByLaboratory') {
          const { laboratoryId } = (input as any) ?? {};
          observer.next({ result: { data: localdb.listMachinesByLab(Number(laboratoryId)) as any } });
          observer.complete();
          return;
        }
        if (path === 'auth.me') {
          // Retorna usuário salvo localmente (se existir)
          const stored = localStorage.getItem('local-auth');
          const user = stored ? JSON.parse(stored) : null;
          observer.next({ result: { data: user as any } });
          observer.complete();
          return;
        }
      }
      if (type === 'mutation') {
        if (path === 'academicUnits.create') {
          const created = localdb.createUnit(input as any);
          observer.next({ result: { data: created as any } });
          observer.complete();
          return;
        }
        if (path === 'academicUnits.update') {
          const anyInput = input as any;
          const id = anyInput.id;
          const patch = anyInput.data ?? { ...anyInput };
          delete (patch as any).id;
          const updated = localdb.updateUnit(id, patch);
          observer.next({ result: { data: updated as any } });
          observer.complete();
          return;
        }
        if (path === 'laboratories.create') {
          const created = localdb.createLab(input as any);
          observer.next({ result: { data: created as any } });
          observer.complete();
          return;
        }
        if (path === 'laboratories.update') {
          const anyInput = input as any;
          const id = anyInput.id;
          const patch = anyInput.data ?? { ...anyInput };
          delete (patch as any).id;
          const updated = localdb.updateLab(id, patch);
          observer.next({ result: { data: updated as any } });
          observer.complete();
          return;
        }
        if (path === 'laboratories.delete') {
          const { id } = (input as any) ?? {};
          const ok = localdb.deleteLab(Number(id));
          observer.next({ result: { data: ok as any } });
          observer.complete();
          return;
        }
        if (path === 'software.create') {
          const created = localdb.createSoftware(input as any);
          observer.next({ result: { data: created as any } });
          observer.complete();
          return;
        }
        if (path === 'software.update') {
          const anyInput = input as any;
          const id = anyInput.id;
          const patch = anyInput.data ?? { ...anyInput };
          delete (patch as any).id;
          const updated = localdb.updateSoftware(id, patch);
          observer.next({ result: { data: updated as any } });
          observer.complete();
          return;
        }
        if (path === 'software.delete') {
          const { id } = (input as any) ?? {};
          const ok = localdb.deleteSoftware(Number(id));
          observer.next({ result: { data: ok as any } });
          observer.complete();
          return;
        }
        if (path === 'machines.create') {
          const created = localdb.createMachine(input as any);
          observer.next({ result: { data: created as any } });
          observer.complete();
          return;
        }
        if (path === 'machines.update') {
          const anyInput = input as any;
          const id = anyInput.id;
          const patch = anyInput.data ?? { ...anyInput };
          delete (patch as any).id;
          const updated = localdb.updateMachine(id, patch);
          observer.next({ result: { data: updated as any } });
          observer.complete();
          return;
        }
        if (path === 'machines.delete') {
          const { id } = (input as any) ?? {};
          const ok = localdb.deleteMachine(Number(id));
          observer.next({ result: { data: ok as any } });
          observer.complete();
          return;
        }
        if (path === 'auth.logout') {
          localStorage.removeItem('local-auth');
          observer.next({ result: { data: true as any } });
          observer.complete();
          return;
        }
      }
      // Fallback: seguir fluxo normal
      return next(op).subscribe(observer);
    } catch (e) {
      observer.error(e as any);
    }
  });
};

const trpcClient = trpc.createClient({
  links: [
    localLink,
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
