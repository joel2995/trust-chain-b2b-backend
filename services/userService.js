import User from "../models/User.js";
import { getCache, setCache } from "../utils/cache.js";

export const getUserProfile = async (userId) => {
  const cacheKey = `user:${userId}`;

  // 1️⃣ Try Redis
  const cachedUser = await getCache(cacheKey);
  if (cachedUser) return cachedUser;

  // 2️⃣ Fallback to DB
  const user = await User.findById(userId).lean();
  if (!user) return null;

  // 3️⃣ Store in Redis
  await setCache(cacheKey, user, 300);

  return user;
};
