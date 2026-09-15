import Joi from 'joi';
import { handleValidationError } from '../../../../shared/utils/validateRequest';


// ─── Schemas ──────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),

  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email',
  }),

  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[\W_]/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
    }),

  phone: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required().messages({
    'string.empty': 'Phone is required',
    'string.length': 'Phone must be exactly 10 digits',
    'string.pattern.base': 'Phone must contain only numbers',
  }),

  role: Joi.string().valid('admin', 'resident', 'security').optional().messages({
    'any.only': 'Invalid role',
  }),
});

const loginSchema = Joi.object({
  identifier: Joi.string().trim().required().messages({
    'string.empty': 'Email or mobile number is required',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email',
  }),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().optional().messages({
    'string.email': 'Please provide a valid email',
  }),

  code: Joi.string().trim().optional(),
  token: Joi.string().trim().optional(),

  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[\W_]/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
    }),
}).or('code', 'token').messages({
  'object.missing': 'Verification code or reset token is required',
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),

  phone: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required().messages({
    'string.empty': 'Phone is required',
    'string.length': 'Phone must be exactly 10 digits',
    'string.pattern.base': 'Phone must contain only numbers',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[\W_]/)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
    }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
  }),
});

// ─── Exported validators ──────────────────────────────────────────
export const validateRegister = [handleValidationError(registerSchema, 'body')];
export const validateLogin = [handleValidationError(loginSchema, 'body')];

export const validateForgotPassword = [handleValidationError(forgotPasswordSchema, 'body')];
export const validateResetPassword = [handleValidationError(resetPasswordSchema, 'body')];

export const validateUpdateProfile = [handleValidationError(updateProfileSchema, 'body')];
export const validateChangePassword = [handleValidationError(changePasswordSchema, 'body')];

export const validateRefreshToken = [handleValidationError(refreshTokenSchema, 'body')];