import { handleDonki, preflight } from "../_lib/nasa.js";

// GET /api/donki/:type?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD (CDN cache 1 h)
export const GET = (req: Request) => handleDonki(req);
export const OPTIONS = preflight;
