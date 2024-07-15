import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import detectObjects from "./model/detector";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Define routes
// Route for serving the index.ejs
app.get("/", (req: Request, res: Response) => {
  res.render("index", {
    title: "Detection Page",
  });
});

app.post('/upload', () => {

});
app.get('/predictions', () => {
    
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
