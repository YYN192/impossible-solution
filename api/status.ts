import { handleStatus, preflight } from "./_lib/nasa.js";

// GET /api/status: which NASA upstreams answer now (CDN cache 5 min)
export const GET = (req: Request) => handleStatus(req);
export const OPTIONS = preflight;
