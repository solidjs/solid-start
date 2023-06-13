import { QueryClient } from "@tanstack/solid-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCSolidStart } from "solid-trpc";
import { AppRouter } from "~/server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // replace example.com with your actual production url
  if (process.env.NODE_ENV === "production") return "https://example.com";
  return `http://127.0.0.1:${process.env.PORT ?? 3000}`;
};

export const api = createTRPCSolidStart<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`
        })
      ]
    };
  }
});

export const queryClient = new QueryClient();
