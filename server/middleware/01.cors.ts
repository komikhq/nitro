import { defineMiddleware, handleCors } from "nitro/h3";

export default defineMiddleware((event) => {
  handleCors(event, {
    origin: (origin: string) => {
      if (!origin) return true;
      if (
        origin.includes("komikhq.com") ||
        origin.includes("komikhq.dpdns.org") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
      ) {
        return true;
      }
      return false;
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Content-Length", "Content-Range", "Set-Cookie"],
  });
});
