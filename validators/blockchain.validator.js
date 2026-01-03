import Joi from "joi";

export const writeProofSchema = Joi.object({
  cid: Joi.string().min(5).required(),
  fileHash: Joi.string().min(10).required(),
});
