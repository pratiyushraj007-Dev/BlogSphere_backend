const express = require("express");
const authControllers = require("../controllers/auth.controllers");
const userModel = require("../models/schema");
const { Google, generateCodeVerifier, generateState } = require("arctic");

const google = new Google(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.CALLBACK_URL
)


const router = express.Router();
router.get("/otpSession", authControllers.restrictedOtpPage)
router.get("/token", authControllers.userCredentials)

router.get("/currentUser", authControllers.userDetails)


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
    const user = await userModel.findOne({ userEmail: googleUser.email });
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


module.exports = router