import dotenv from "dotenv";
import connection from "./db/dbConnection.js";
import  app  from "./app.js";
// Load environment variables
dotenv.config({
  path: "./.env",
});

// Use the port from the environment variable or default to 3000
const port = process.env.PORT || 3000;

connection()
  .then(() => {
    app.listen(port,() => {
      console.log(`Server running at ${port}`);
    });
  })
  .catch((err) => console.log("MongoDB connection failed", err));
