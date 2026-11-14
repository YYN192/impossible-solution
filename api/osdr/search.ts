import { handleOsdrSearch, preflight } from "../_lib/nasa.js";

// GET /api/osdr/search?term=Veggie&size=5 (CDN cache 1 day)
export const GET = (req: Request) => handleOsdrSearch(req);
export const OPTIONS = preflight;
