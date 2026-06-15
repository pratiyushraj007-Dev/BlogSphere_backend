const validator = require("email-validator");
const nodemailer = require("nodemailer");
const userModel = require("../models/schema")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require("../config/cloudinary");
const crypto = require("crypto");


const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
        user: process.env.HOST_EMAIL,
        pass: process.env.HOST_PASSWORD
    }
})

const validatedUser = async (req, res) => {
    const { userName, userEmail, userPassword, userConfirmPassword, userDesc } = req.body;
    const userProfile = req.file;
    if (!(validator.validate(userEmail))) {
        return res.status(400).json({
            message: "Invalid email please write a valid email"
        })
    }
    if (userPassword !== userConfirmPassword) {
        return res.status(400).json({
            message: "Password and Confirm Password should be same"
        })
    }
    const isUserExist = await userModel.findOne({ userName });
    if (isUserExist) {
        return res.status(400).json({
            message: "User already Exist please login to continue"
        })
    }
    let result;
    if (userProfile) {
        const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        const uploadResult = await cloudinary.uploader.upload(dataURI);
        result = uploadResult.secure_url;
    } else {
        result = "https://res.cloudinary.com/default-avatar.png";
    }
    const otp = (Math.floor(100000 + 900000 * Math.random())).toString();

    try {
        await transporter.sendMail({
            from: process.env.HOST_EMAIL,
            to: userEmail,
            subject: "Here is your generated otp",
            text: `Your otp is ${otp}`
        })
    } catch (err) {
        console.log(err)
        return res.status(400).json({
            message: "server error"
        })
    }
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const hashedOTP = await bcrypt.hash(otp, 10);
    const token = jwt.sign({
        userName,
        userEmail,
        userProfile: result,
        userPassword: hashedPassword,
        userDesc,
        otp: hashedOTP,
        step: "sign-up"
    }, process.env.JWT_SECRET, {
        expiresIn: "5m"
    })
    res.cookie("tempToken", token, {
        maxAge: 5 * 60 * 1000, // 5 minutes
        httpOnly: true,
        sameSite: "None",
        secure:true
    });
    res.status(200).json({
        message: "Verified",
    })
}

const restrictedOtpPage = (req, res) => {
    const tempToken = req.cookies.tempToken;
    if (tempToken) {
        jwt.verify(tempToken, process.env.JWT_SECRET);

        return res.status(200).json({
            message: "Verified Route",
        });

    } else {
        res.status(400).json({
            message: "Unverified"
        })
    }
}

const registeredUser = async (req, res) => {
    const { otp } = req.body;
    const tempToken = req.cookies.tempToken;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    console.log(decoded)
    const otpVerification = await bcrypt.compare(otp, decoded.otp); //bcrypt.compare(plainText, hashedText)
    if (otpVerification) {
        await userModel.create({
            userName: decoded.userName,
            userEmail: decoded.userEmail,
            userPassword: decoded.userPassword,
            userDesc: decoded.userDesc,
            userProfile: decoded.userProfile
        })
        return res.status(200).json({
            message: "You are registered"
        })
    } else {
        return res.status(400).json({
            message: "INVALID OTP"
        })
    }
}

const loginUser = async (req, res) => {
    const { userEmail, userPassword } = req.body;
    const user = await userModel.findOne({ userEmail });
    if (user) {
        const passwordVerify = await bcrypt.compare(userPassword, user.userPassword);
        if (passwordVerify) {
            const BlogSphere = jwt.sign({
                userID: user._id,
                userEmail: user.userEmail
            }, process.env.JWT_SECRET)
            res.cookie("BlogSphere", BlogSphere, {
                maxAge: 7 * 24 * 60 * 60 * 1000,//7day
                httpOnly: true,
                sameSite: "None",
                secure:true
            })
            return res.status(400).json({
                message: "success",
                httpOnly: true
            })
        } else {
            return res.status(400).json({
                message: "INVALID PASSWORD"
            })
        }
    } else {
        return res.status(400).json({
            message: "User not found pls registered first"
        })
    }
}


const logout = async (req, res) => {
    res.clearCookie("BlogSphere");
    res.status(200).json({
        message: "logout"
    })
}


const userCredentials = (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        return res.status(200).json({
            BlogSphereToken: BlogSphereToken,
            message: "userCredentials"
        })
    } else {
        return res.status(400).json({
            message: "not login"
        })
    }
}

const userDetails = async (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        try {
            const decoded = jwt.verify(BlogSphereToken, process.env.JWT_SECRET);
            const user = await userModel.findOne({ userEmail: decoded.userEmail })
            return res.status(200).json({
                userName: user.userName,
                userEmail: user.userEmail,
                userProfile: user.userProfile,
                userDesc: user.userDesc,
                message: "verified"
            })
        } catch (error) {
            console.log(error)
            return res.status(400).json({
                message: "server error"
            })
        }
    } else {
        return res.status(400).json({
            message: "pls login again"
        })
    }
}


const setProfile = async (req, res) => {
    const { userEmail } = req.body
    try {
        const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        const result = await cloudinary.uploader.upload(dataURI);
        await userModel.updateOne({
            userEmail
        }, {
            $set: {
                userProfile: result.secure_url
            }
        }
        )
        return res.status(200).json({
            message: "Profile Picture updated"
        })
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            message: "something cause error"
        })
    }
}

const confirmEmail = async (req, res) => {
    const { emailValue } = req.body;
    if (!validator.validate(emailValue)) {
        return res.status(200).json({
            message: "INVALID "
        })
    }
    if (emailValue) {
        try {
            const user = await userModel.findOne({ userEmail: emailValue })
            if (user) {

                //1.Generate token
                const token = crypto.randomBytes(32).toString("hex");

                // 2.hashed token
                const hashedToken = await bcrypt.hash(token, 5);

                //3.save hashed token
                user.resetToken = hashedToken;
                user.resetTokenExpiry = Date.now() + 5 * 60 * 1000; //5 minutes from now
                await user.save();

                //4 send token
                const resentLink = `http://localhost:5173/reset-password/${emailValue}-${token}`;
                await transporter.sendMail({
                    from: process.env.HOST_EMAIL,
                    to: emailValue,
                    subject: "Password Reset Link",
                    text: `Your password resent link ${resentLink}`
                })
                return res.status(200).json({
                    message: "Reset Password link sent to your gmail and it will valid for 5 minutes"
                })
            } else {
                return res.status(200).json({
                    message: "user does not exist"
                })
            }
        } catch (error) {
            console.log(error)
            return res.status(400).json({
                message: "server error"
            })
        }
    }
}

const resetPassword = async (req, res) => {
    const { email, password, confirmPassword, token } = req.body;
    if (!validator.validate(email)) {
        return res.status(400).json({
            message: "Email is invalid"
        })
    }
    if (password !== confirmPassword) {
        return res.status(401).json({
            message: "password and confirm password does not match"
        })
    }
    const user = await userModel.findOne({ userEmail: email });
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    if (user.resetTokenExpiry < Date.now()) {
        return res.status(400).json({
            message: "Token Expired"
        })
    }
    const isMatch = await bcrypt.compare(token, user.resetToken);
    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid token"
        })
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.userPassword = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.status(200).json({
        message: "Password Changed Successfully"
    })
}



module.exports = { validatedUser, restrictedOtpPage, registeredUser, loginUser, userCredentials, userDetails, setProfile, logout, confirmEmail, resetPassword }