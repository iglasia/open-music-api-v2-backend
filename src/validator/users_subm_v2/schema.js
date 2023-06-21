const Joi = require('joi');

const User_subm_v2_PayloadSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  fullname: Joi.string().required(),
});

module.exports = { User_subm_v2_PayloadSchema };