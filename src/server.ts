import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { fetchAnilistInfo, getServers, getSources } from "./utils/methods";
import { cors } from "hono/cors"; // Import the CORS middleware

const app = new Hono();

// Define an array of allowed origins
const allowedOrigins = [
  "https://aniteams-v2.vercel.app",
  "https://aniteams-next.netlify.app",
];

// Use the CORS middleware globally with a function to check the origin
app.use(cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return true; // Allow requests with no origin
    return allowedOrigins.includes(origin) ? origin : null; // Return the origin if allowed, otherwise null
  },
}));

app.get("/", async (c) => {
  return c.json({
    about:
      "This API maps anilist anime to https://hianime.to and also returns the M3U8 links !",
    status: 200,
    routes: [
      "/anime/info/:anilistId",
      "/anime/servers/:episodeId",
      "/anime/sources?serverId={server_id}&episodeId={episode_id}",
    ],
  });
});

app.get("/anime/info/:id", async (c) => {
  const id = c.req.param("id");
  const data = await fetchAnilistInfo(Number(id));
  if (!data) {
    throw new HTTPException(500, { message: "Internal server issue !" });
  }
  return c.json({ data });
});

app.get("/anime/servers/:id", async (c) => {
  const id = c.req.param("id");
  const data = await getServers(id);
  if (!data) {
    throw new HTTPException(500, { message: "Internal server issue !" });
  }
  return c.json({ data });
});

app.get("/anime/sources", async (c) => {
  const { serverId, episodeId } = c.req.query();
  if (!serverId || !episodeId) {
    throw new HTTPException(400, { message: "Both serverId and episodeId are required!" });
  }
  const data = await getSources(serverId, episodeId);
  if (!data) {
    throw new HTTPException(500, { message: "Internal server issue !" });
  }
  return c.json({ data });
});

serve({
  port: Number(process.env.PORT) || 5000,
  fetch: app.fetch,
});
