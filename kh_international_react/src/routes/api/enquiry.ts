import { createFileRoute } from "@tanstack/react-router";

// Server-only route. The handler module lives under src/server/ (import-protected from the client)
// and is loaded lazily so nothing from it can reach the browser bundle.
// POST is the only supported method; every other method gets 405 with `Allow: POST`.
const notAllowed = async () => {
  const { methodNotAllowed } = await import("@/server/enquiry/handler.server");
  return methodNotAllowed();
};

export const Route = createFileRoute("/api/enquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleEnquiryRequest } = await import("@/server/enquiry/handler.server");
        return handleEnquiryRequest(request);
      },
      GET: notAllowed,
      HEAD: notAllowed,
      PUT: notAllowed,
      PATCH: notAllowed,
      DELETE: notAllowed,
      OPTIONS: notAllowed,
    },
  },
});
