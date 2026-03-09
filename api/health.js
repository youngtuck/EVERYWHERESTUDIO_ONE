/**
 * Vercel serverless: GET /api/health — Backend reachable check.
 */
function setCors(res, req) {
  const origin = req.headers?.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
}

export default async function handler(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") return res.status(204).end();
  return res.status(200).json({ ok: true, message: "EVERYWHERE Studio API" });
}
