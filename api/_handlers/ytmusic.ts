import { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import worker from "../worker.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = (req.headers["x-forwarded-host"] as string) || (req.headers.host as string) || "localhost";
    const url = `${protocol}://${host}${req.url || "/"}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, String(v)));
        } else {
          headers.set(key, String(value));
        }
      }
    }

    const webReq = new Request(url, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
      // @ts-ignore
      duplex: "half",
    });

    const response = await worker.fetch(webReq, {} as any, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as any);

    res.status(response.status);
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("[YTMusic Handler] Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
