const express = require("express");
const authControllers = require("../controllers/auth.controllers");
const userModel = require("../models/schema");

const router = express.Router();
router.get("/otpSession", authControllers.restrictedOtpPage)
router.get("/token", authControllers.userCredentials)

router.get("/currentUser", authControllers.userDetails)



module.exports = router