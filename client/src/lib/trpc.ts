import { createTRPCReact } from "@trpc/react-query";

// Em modo 100% local, não precisamos do tipo AppRouter do backend.
// Para simplificar a tipagem e evitar erros, expomos `trpc` como any.
export const trpc: any = createTRPCReact<any>();
