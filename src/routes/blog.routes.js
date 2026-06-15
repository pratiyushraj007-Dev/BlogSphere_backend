const express=require("express");
const blogControllers=require("../controllers/blog.controllers");
const upload=require("../config/multerConfig");

const router=express.Router();

router.post("/postBlog",blogControllers.pushBlog);
router.post("/updateDesc",blogControllers.updateDesc);
router.post("/tiptapImage",upload.single("image"),blogControllers.tiptapImage);
router.get("/seeBlogs",blogControllers.seeBlogs);
router.get("/blog/:BlogID",blogControllers.getBlogInfo);
router.get("/dashboard/userBlog",blogControllers.userBlogs)
router.get("/dashboard/bookmark",blogControllers.bookMarked);
router.post("/toBookmark",blogControllers.toBookMark);


module.exports=router;