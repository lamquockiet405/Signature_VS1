const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    mst: Joi.string().pattern(/^[0-9]{10,13}$/).allow('').optional(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).optional(),
    organization: Joi.string().max(100).optional()
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  certificate: Joi.object({
    serial_number: Joi.string().required(),
    issuer: Joi.string().required(),
    subject: Joi.string().required(),
    valid_from: Joi.date().required(),
    valid_to: Joi.date().required(),
    public_key: Joi.string().required(),
    certificate_chain: Joi.string().optional()
  }),

  fileUpload: Joi.object({
    file_type: Joi.string().valid('pdf', 'docx', 'xlsx', 'doc', 'xls').required()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  schemas,
  validate
};
