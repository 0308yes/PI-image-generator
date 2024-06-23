import mongoose from 'mongoose'
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to Mongo Successfully!");
    } catch (error) {
        console.log(error);
    }
})()
export default mongoose;

