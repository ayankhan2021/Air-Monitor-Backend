import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const DB_URI = process.env.MONGODB_URL

const connection = async () => {
    try {
        const connectionInstance = await mongoose.connect(`mongodb+srv://ayan12345:ayan12345@cluster-1.kh6okyv.mongodb.net/${DB_NAME}`)
        console.log("MongoDB connected");
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

export default connection;

