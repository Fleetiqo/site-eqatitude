// Loads .env like `next dev` / `next start` do, before any app module reads process.env.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
