import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 EXPLICIT .env PATH
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
