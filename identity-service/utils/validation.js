const joi = require('joi');

const validateRegistration=(data)=>{
  const schema = joi.object({
    username: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required(),
    email: joi.string().email().required(),

  });
  return schema.validate(data);
}

module.exports = { validateRegistration };
