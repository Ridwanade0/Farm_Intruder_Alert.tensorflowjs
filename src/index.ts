import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import detectObjects from "./model/detector"; // Assuming `readImage` function is imported from detector.ts

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create an HTTP server and attach the Express app
const server = createServer(app);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Define routes
app.get("/", (req: Request, res: Response) => {
  res.render("index", {
    title: "Home Page",
  });
});

// WebSocket server setup
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket connection");

  ws.on("message", async (message: Buffer) => {
    console.log("Received message of length:", message.length);

    // Process the image buffer for object detection
    try {
      const detectionResults = await detectObjects(message);
      console.log("Object detection result:", detectionResults);

      // Send the result to the WebSocket client if objects are detected
      if (detectionResults.length > 0) {
        ws.send(JSON.stringify(detectionResults));
      }
    } catch (err) {
      console.error("Error during object detection:", err);
      ws.send(JSON.stringify({ error: "Object detection failed" }));
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
