const express=require("express");
const authControllers=require("../controllers/auth.controllers");
const blogControllers=require("../controllers/blog.controllers");
const upload=require("../config/multerConfig");

const router =express.Router();

router.post("/validatedUser",upload.single("userProfile"),authControllers.validatedUser)
router.post("/register",authControllers.registeredUser)
router.post("/loginUser",authControllers.loginUser);
router.post("/setProfile",upload.single("image"),authControllers.setProfile);
router.post("/confirmEmail",authControllers.confirmEmail);
router.post("/resetPassword",authControllers.resetPassword);
router.post("/logout",authControllers.logout)

module.exports=router;