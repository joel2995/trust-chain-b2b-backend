// server.js
import "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
