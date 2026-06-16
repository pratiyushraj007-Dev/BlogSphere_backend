const jwt = require("jsonwebtoken");
const userModel = require("../models/schema");
const blogModel = require("../models/blogSchema");
const cloudinary = require("../config/cloudinary");
const uploadCloudinary = require("../../utils/uploadToCloudinary");
const pushBlog = async (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        const decoded = jwt.verify(BlogSphereToken, process.env.JWT_SECRET);
        const user = await userModel.findOne({ userEmail: decoded.userEmail });
        if (user) {
            try {
                const blog = await blogModel.create({
                    blog_title: req.body.title,
                    blog_summary: req.body.summary,
                    blog_desc: req.body.content,
                    authorName: user.userName,
                    authorEmail: user.userEmail,
                })
                await userModel.updateOne(
                    { userEmail: user.userEmail },
                    {
                        $push: {
                            blog: {
                                "title": req.body.title,
                                "summary": req.body.summary,
                                "blog_id": blog._id
                            }
                        },
                        $inc: { totalBlog: 1 }
                    },
                )
                return res.status(200).json({
                    message: "Your blog has been successfully added. Please visit the dashboard to view it."
                })
            } catch (error) {
                console.log(error)
                res.status(400).json({
                    message: "Server error"
                })
            }
        } else {
            return res.status(400).json({
                message: "Invalid Request"
            })
        }
    } else {
        return res.status(400).json({
            message: "Pls login first"
        })
    }
}
const updateDesc = async (req, res) => {
    try {
        const { email, desc } = req.body;
        await userModel.updateOne({
            userEmail: email,
        }, {
            $set: {
                userDesc: desc
            }
        })
        return res.status(200).json({
            message: "Bio Updated"
        })
    } catch (error) {
        return res.status(400).json({
            message: "server error"
        })
    }
    res.status(200).json({
        message: "updated"
    })
}


const tiptapImage = async (req, res) => {
    try {
        const result = await uploadCloudinary(req.file.buffer);
        res.status(200).json({
            secure_URL: result.secure_url,
            public_id: result.public_id,
            message: "Image added"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "server error"
        })
    }
}

const seeBlogs = async (req, res) => {
    const blogArray = [];
    try {
        const blogs = await blogModel.find().sort({ createdAt: -1 })
        for (const blog of blogs) {
            blogArray.push({
                authorName: blog.authorName,
                authorEmail: blog.authorEmail,
                blog_title: blog.blog_title,
                blog_summary: blog.blog_summary,
                blog_link: blog.blog_link
            })
        }
        return res.status(200).json({
            message: "success",
            blogArray: blogArray
        })
    } catch (error) {
        return res.status(400).json({
            message: "server error"
        })
    }
}

const getBlogInfo = async (req, res) => {
    const { BlogID } = req.params;
    if (BlogID) {
        const [id, title] = BlogID.split("-");
        try {
            const reqBlog = await blogModel.findOne({ _id: id });
            res.status(200).json({
                message: "success",
                authorName: reqBlog.authorName,
                authorEmail: reqBlog.authorEmail,
                blog_title: reqBlog.blog_title,
                blog_summary: reqBlog.blog_summary,
                blog_id: reqBlog._id,
                blog_desc: reqBlog.blog_desc,
                like: reqBlog.like
            })
        } catch (error) {
            return res.status(400).json({
                message: "Server error"
            })
        }
    }
}

const userBlogs = async (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        const decoded = jwt.verify(BlogSphereToken, process.env.JWT_SECRET);
        const user = await userModel.findOne({ userEmail: decoded.userEmail });
        if (user) {
            const blog = user.blog;
            return res.status(200).json({
                message: "retrieve",
                blog
            })
        }
    }
    return res.status(400).json({
        message: "error"
    })
}

const bookMarked = async (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        const decoded = jwt.verify(BlogSphereToken, process.env.JWT_SECRET);
        const user = await userModel.findOne({ userEmail: decoded.userEmail });
        if (user) {
            const blog = user.Bookmark;
            return res.status(200).json({
                message: "retrieve",
                blog
            })
        }
    }
    return res.status(400).json({
        message: "verified"
    })
}

const toBookMark = async (req, res) => {
    const BlogSphereToken = req.cookies.BlogSphere;
    if (BlogSphereToken) {
        const { title, summary, author, blog_id } = req.body;
        const Bookmark = {
            title,
            summary,
            author,
            blog_id
        }
        try {
            const decoded = await jwt.verify(BlogSphereToken, process.env.JWT_SECRET);
            const user = await userModel.findOne({ userEmail: decoded.userEmail });
            const bookmarkArray = user.Bookmark;

            if (bookmarkArray.some(bookmark => bookmark.blog_id === blog_id)) {
                return res.status(200).json({
                    message: "Already added to your bookmark"
                });
            } else {
                bookmarkArray.push(Bookmark);
                await user.save();

                return res.status(200).json({
                    message: "Added to your Bookmark"
                });
            }
        } catch (error) {
            return res.status(400).json({
                message: "Server error"
            })
        }

    } else {
        return res.status(200).messgae({
            message: "Login to get bookmark access"
        })
    }
    res.status(400).json({
        messgae: "Error"
    })
}
module.exports = { pushBlog, updateDesc, tiptapImage, seeBlogs, getBlogInfo, userBlogs, bookMarked, toBookMark }