require("dotenv").config();
const dns=require("dns");
dns.setServers(["1.1.1.1","0.0.0.0"])

const app=require("./src/app.js");
const connectDB=require("./src/db/db.js");
const PORT=process.env.PORT;


connectDB();
app.listen(PORT,()=>{
    console.log(`server is listening at ${PORT}....`)
})