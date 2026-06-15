const mongoose=require("mongoose");
const { create } = require("./schema");

const blogSchema=new mongoose.Schema({
    authorName:{
        type:String,
        required:true
    },
    authorEmail:{
        type:String,
        required:true
    },
    blog_title:{
        type:String,
        required:true
    },
    blog_summary:{
        type:String,
        required:true
    },
    blog_desc:{
        type:Object,
        required:true
    },
    blog_link:{
        type:String,
        required:true
    },
    createAt:{
        type:Date,
        default:Date.now()
    },
    like:{
        type:Number,
        default:0
    }
})
blogSchema.pre("validate", async function() {
    if (!this.blog_link) {
        this.blog_link = `${this._id}-${this.blog_title}`;
    }
});

const blogModel=mongoose.model("allBlogs",blogSchema)

module.exports=blogModel