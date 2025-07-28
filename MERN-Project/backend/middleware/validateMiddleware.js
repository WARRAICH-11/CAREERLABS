/**
 * Middleware for validating request data
 */

// Validate request body against a schema
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      // If no schema is provided, skip validation
      if (!schema) return next();
      
      // Basic validation for required fields
      if (schema.required && schema.required.length > 0) {
        for (const field of schema.required) {
          if (req.body[field] === undefined) {
            return res.status(400).json({ 
              message: `Missing required field: ${field}` 
            });
          }
        }
      }
      
      // Type validation (very basic)
      if (schema.properties) {
        for (const [field, config] of Object.entries(schema.properties)) {
          if (req.body[field] !== undefined) {
            const type = config.type;
            
            // Type validation logic
            if (type === 'string' && typeof req.body[field] !== 'string') {
              return res.status(400).json({ 
                message: `Field ${field} must be a string` 
              });
            }
            
            if (type === 'number' && typeof req.body[field] !== 'number') {
              return res.status(400).json({ 
                message: `Field ${field} must be a number` 
              });
            }
            
            if (type === 'boolean' && typeof req.body[field] !== 'boolean') {
              return res.status(400).json({ 
                message: `Field ${field} must be a boolean` 
              });
            }
            
            if (type === 'array' && !Array.isArray(req.body[field])) {
              return res.status(400).json({ 
                message: `Field ${field} must be an array` 
              });
            }
            
            if (type === 'object' && (typeof req.body[field] !== 'object' || Array.isArray(req.body[field]))) {
              return res.status(400).json({ 
                message: `Field ${field} must be an object` 
              });
            }
          }
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateBody
}; 