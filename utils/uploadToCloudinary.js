const streamifier=require("streamifier");
const cloudinary=require("../src/config/cloudinary");

const uploadCloudinary=async(buffer)=>{
    return new Promise((resolve,reject)=>{
        const stream=cloudinary.uploader.upload_stream(
            {
                folder:"Blog_images",
                transformation:[
                    {
                        width:800,
                        crop:"limit",
                        quality:"auto",
                        fetch_format:"auto"
                    }
                ]
            },
            (error,result)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(result);
                }
            }
        );
        streamifier
                    .createReadStream(buffer)
                    .pipe(stream)
    })
}
module.exports=uploadCloudinary;