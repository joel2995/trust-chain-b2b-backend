import UserEvent from "../models/UserEvent.js";

export const logUserEvent = async ({
  userId,
  title,
  description,
  mode,
  type = "system",
}) => {
  try {
    await UserEvent.create({
      userId,
      title,
      description,
      mode,
      type,
    });
  } catch (err) {
    console.error("User event log failed:", err.message);
  }
};
