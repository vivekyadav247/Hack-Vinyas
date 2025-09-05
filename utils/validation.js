const Joi = require('joi');

// Validation schemas
const validationSchemas = {
    // Team registration validation
    teamRegistration: Joi.object({
        otp: Joi.string()
            .pattern(/^\d{6}$/)
            .optional()
            .messages({
                'string.pattern.base': 'OTP must be exactly 6 digits'
            }),
            
        teamName: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Team name is required',
                'string.min': 'Team name must be at least 2 characters',
                'string.max': 'Team name cannot exceed 100 characters'
            }),

        psNumber: Joi.string()
            .trim()
            .required()
            .messages({
                'string.empty': 'Problem Statement Number is required'
            }),

        problemStatement: Joi.string()
            .trim()
            .required()
            .messages({
                'string.empty': 'Problem Statement is required'
            }),
        
        leaderName: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s]+$/)
            .required()
            .messages({
                'string.empty': 'Leader name is required',
                'string.min': 'Leader name must be at least 2 characters',
                'string.max': 'Leader name cannot exceed 50 characters',
                'string.pattern.base': 'Leader name should only contain letters and spaces'
            }),

        leaderEnrollment: Joi.string()
            .trim()
            .required()
            .messages({
                'string.empty': 'Leader enrollment number is required'
            }),
        
        leaderEmail: Joi.string()
            .email({ tlds: { allow: false } })
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'Leader email is required',
                'string.email': 'Please enter a valid email address'
            }),

        // Member fields (optional)
        member2Name: Joi.string().trim().optional().allow(''),
        member2Enrollment: Joi.string().trim().optional().allow(''),
        member2Email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),

        member3Name: Joi.string().trim().optional().allow(''),
        member3Enrollment: Joi.string().trim().optional().allow(''),
        member3Email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),

        member4Name: Joi.string().trim().optional().allow(''),
        member4Enrollment: Joi.string().trim().optional().allow(''),
        member4Email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),

        member5Name: Joi.string().trim().optional().allow(''),
        member5Enrollment: Joi.string().trim().optional().allow(''),
        member5Email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),

        member6Name: Joi.string().trim().optional().allow(''),
        member6Enrollment: Joi.string().trim().optional().allow(''),
        member6Email: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
        
        members: Joi.array()
            .items(
                Joi.object({
                    name: Joi.string()
                        .trim()
                        .min(2)
                        .max(50)
                        .pattern(/^[a-zA-Z\s]+$/)
                        .required(),
                    enrollment: Joi.string()
                        .trim()
                        .required(),
                    email: Joi.string()
                        .email({ tlds: { allow: false } })
                        .lowercase()
                        .trim()
                        .required(),
                    phone: Joi.string()
                        .pattern(/^[6-9]\d{9}$/)
                        .required(),
                    college: Joi.string()
                        .trim()
                        .min(2)
                        .max(100)
                        .required()
                })
            )
            .max(5)
            .optional()
            .messages({
                'array.max': 'Maximum 5 additional members allowed (excluding leader)'
            }),
        
        teamSize: Joi.number()
            .integer()
            .min(1)
            .max(6)
            .optional()
    }),

    // OTP request validation
    otpRequest: Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please enter a valid email address'
            }),
        
        name: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.empty': 'Name is required',
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name cannot exceed 50 characters'
            })
    }),

    // Admin login validation
    adminLogin: Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please enter a valid email address'
            }),
        
        password: Joi.string()
            .min(6)
            .max(50)
            .required()
            .messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 6 characters'
            })
    }),

    // OTP validation
    otpVerification: Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .lowercase()
            .trim()
            .required(),
        
        otp: Joi.string()
            .pattern(/^\d{6}$/)
            .required()
            .messages({
                'string.empty': 'OTP is required',
                'string.pattern.base': 'OTP must be exactly 6 digits'
            }),
        
        purpose: Joi.string()
            .valid('admin_login', 'password_reset', 'email_verification')
            .default('admin_login')
    }),

    // Payment details validation
    paymentUpdate: Joi.object({
        teamId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid team ID format'
            }),
        
        paymentStatus: Joi.string()
            .valid('pending', 'paid', 'verified', 'rejected')
            .required(),
        
        transactionId: Joi.string()
            .trim()
            .max(100)
            .optional(),
        
        utrNumber: Joi.string()
            .trim()
            .max(50)
            .optional(),
        
        notes: Joi.string()
            .trim()
            .max(500)
            .optional()
    }),

    // PPT submission validation
    pptSubmission: Joi.object({
        teamId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid team ID format'
            })
    }),

    // Email sending validation
    sendEmail: Joi.object({
        recipients: Joi.array()
            .items(
                Joi.object({
                    email: Joi.string().email().required(),
                    teamName: Joi.string().required(),
                    leaderName: Joi.string().optional()
                })
            )
            .min(1)
            .required()
            .messages({
                'array.min': 'At least one recipient is required'
            }),
        
        subject: Joi.string()
            .trim()
            .min(3)
            .max(200)
            .optional()
            .messages({
                'string.min': 'Subject must be at least 3 characters',
                'string.max': 'Subject cannot exceed 200 characters'
            }),
        
        message: Joi.string()
            .trim()
            .min(10)
            .max(5000)
            .required()
            .messages({
                'string.min': 'Message must be at least 10 characters',
                'string.max': 'Message cannot exceed 5000 characters'
            }),
        
        type: Joi.string()
            .valid('info', 'success', 'warning', 'error')
            .default('info'),
            
        emailType: Joi.string()
            .valid('notification', 'welcome')
            .default('notification')
    }),

    // File upload validation
    fileUpload: Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string()
            .valid(
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/jpg'
            )
            .required()
            .messages({
                'any.only': 'Invalid file type. Only PPT, PPTX, PDF, and image files are allowed'
            }),
        size: Joi.number()
            .max(10 * 1024 * 1024) // 10MB
            .required()
            .messages({
                'number.max': 'File size cannot exceed 10MB'
            })
    })
};

// Validation middleware factory
const createValidator = (schema, property = 'body') => {
    return (req, res, next) => {
        console.log(`🔍 Validating ${property}:`, JSON.stringify(req[property], null, 2));
        
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }));

            console.log('❌ Validation failed:', JSON.stringify(errors, null, 2));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        console.log('✅ Validation passed');
        // Replace the original data with validated and sanitized data
        req[property] = value;
        next();
    };
};

// Custom validation functions
const customValidators = {
    // Validate MongoDB ObjectId
    isValidObjectId: (id) => {
        return /^[0-9a-fA-F]{24}$/.test(id);
    },

    // Validate file type for uploads
    isValidFileType: (mimetype, allowedTypes) => {
        return allowedTypes.includes(mimetype);
    },

    // Validate phone number format
    isValidPhone: (phone) => {
        return /^[6-9]\d{9}$/.test(phone);
    },

    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    },

    // Sanitize HTML content
    sanitizeHTML: (text) => {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Validate team size consistency
    validateTeamSize: (members, teamSize) => {
        const actualSize = (members ? members.length : 0) + 1; // +1 for leader
        return actualSize === teamSize;
    }
};

// Error response formatter
const formatValidationError = (error) => {
    if (error.isJoi) {
        return {
            success: false,
            message: 'Validation Error',
            errors: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }))
        };
    }
    
    return {
        success: false,
        message: error.message || 'Validation failed'
    };
};

module.exports = {
    schemas: validationSchemas,
    validate: createValidator,
    validators: customValidators,
    formatError: formatValidationError
};
