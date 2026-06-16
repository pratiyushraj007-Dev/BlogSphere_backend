const express=require("express");
const authControllers=require("../controllers/auth.controllers");
const blogControllers=require("../controllers/blog.controllers");
const upload=require("../config/multerConfig");
const userModel=require("../models/schema");
const jwt=require("jsonwebtoken");
const { Google, generateCodeVerifier, generateState } = require("arctic");

const router =express.Router();

const google = new Google(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.CALLBACK_URL
)


router.post("/validatedUser",upload.single("userProfile"),authControllers.validatedUser)
router.post("/register",authControllers.registeredUser)
router.post("/loginUser",authControllers.loginUser);
router.post("/setProfile",upload.single("image"),authControllers.setProfile);
router.post("/confirmEmail",authControllers.confirmEmail);
router.post("/resetPassword",authControllers.resetPassword);
router.post("/logout",authControllers.logout)

router.get("/google", (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        return res.send("You are already Logged In")
    }
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(
        state,
        codeVerifier,
        ["openid", "profile", "email"]
    );
    url.searchParams.set("prompt", "select_account");
    res.cookie("code_verifier", codeVerifier, {
        maxAge: 10 * 60 * 1000,//10 minute
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.redirect(url.toString());
})

router.get("/google/callback", async (req, res) => {
    const code = req.query.code;
    const codeVerifier = req.cookies.code_verifier;
    if (!code) return res.send("No Code");

    const token = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = token.accessToken();
    const userRes = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }
    )
    const googleUser = await userRes.json();
    let user = await userModel.findOne({ userEmail: googleUser.email });
    if (!user) {
        user = await userModel.create({
            userName: googleUser.name,
            userProfile:googleUser.picture,
            userEmail: googleUser.email,
            provider: "google",
            googleId: googleUser.id
        })
    }
    const BlogSphere = await jwt.sign({
        userEmail: user.userEmail,
        userID: user._id,
    }, process.env.JWT_SECRET);
    res.clearCookie("code_verifier", {
        secure: true,
        sameSite: "none"
    });
    res.cookie("BlogSphere", BlogSphere, {
        maxAge: 7 * 24 * 60 * 60 * 1000, //7days
        httpOnly: true,
        secure: true,
        sameSite: "none"
    })
    res.redirect("https://blog-sphere-frontend-mocha.vercel.app/");
})

module.exports=router;