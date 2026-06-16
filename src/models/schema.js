const mongoose=require("mongoose");

const userLoginModel=new mongoose.Schema({
    userName:{
        type:String,
        required:true
    },
    userProfile:{
        type:String,
        default:""
    },
    userEmail:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim: true
    },
    userPassword:{
        type:String,
    },
    userDesc:{
        type:String,
        default:""
    },
    blog:{
        type:Array,
        default:[]
    },
    totalBlog:{
        type:Number,
        default:0
    },
    Bookmark:{
        type:Array,
        default:[]
    },
    resetToken:String,
    resetTokenExpiry:Date
})

const userModel =mongoose.model("user",userLoginModel);
module.exports=userModel;