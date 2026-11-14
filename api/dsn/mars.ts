import { handleDsnMars, preflight } from "../_lib/nasa.js";

// GET /api/dsn/mars: Mars spacecraft on the Deep Space Network now + round-trip light time (CDN cache 60 s)
export const GET = (req: Request) => handleDsnMars(req);
export const OPTIONS = preflight;
