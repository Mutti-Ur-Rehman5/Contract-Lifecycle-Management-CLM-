import Joi from 'joi';
import { errorResponse } from '../utils/apiResponse.js';

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return errorResponse(res, messages.join('; '), 400, 'VALIDATION_ERROR');
    }

    req[property] = value;
    next();
  };
};

export default validate;
