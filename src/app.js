const express=require("express");
// const dotenv=require("dotenv");
const cors = require("cors");
const cookieParser=require("cookie-parser");
const postRoutes=require("../src/routes/post.routes");
const getRoutes=require("../src/routes/get.routes");
const blogRoutes=require("../src/routes/blog.routes");
const app=express();

// dotenv.config()

app.use(
  cors({
    origin: "https://blog-sphere-frontend-mocha.vercel.app",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",postRoutes);
app.use("/api/verify",getRoutes);
app.use("/blogApi",blogRoutes);

module.exports=app;