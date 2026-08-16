import { body, param, query, validationResult } from "express-validator";

// Helper to handle validation results
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => err.msg),
    });
  }
  next();
};

// Registration validation
export const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .isAlphanumeric()
    .withMessage("Username must contain only letters and numbers"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("phone")
    .optional()
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage("Invalid phone number format"),
  handleValidation,
];

// Email login validation
export const validateEmailLogin = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  handleValidation,
];

// Phone login validation
export const validatePhoneLogin = [
  body("phone")
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage("Invalid phone number format"),
  handleValidation,
];

// OTP verification validation
export const validateOtp = [
  body("otp")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be 6 digits"),
  handleValidation,
];

// Property validation
export const validateProperty = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("propertyType")
    .isIn(["APARTMENT", "HOUSE", "VILLA", "PLOT", "COMMERCIAL"])
    .withMessage("Invalid property type"),
  body("saleType")
    .isIn(["SALE", "RENT"])
    .withMessage("Invalid sale type"),
  handleValidation,
];

// ID parameter validation
export const validateId = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID"),
  handleValidation,
];
