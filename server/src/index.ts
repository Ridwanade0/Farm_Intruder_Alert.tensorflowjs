import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import detectObjects from "../model/detector";

// Initialize dotenv to read from .env file
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// Create an HTTP server using Express
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Initialize WebSocket server instance
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  // Handle incoming messages from clients
  ws.on("message", async (message: Buffer) => {
    const predictions = await detectObjects(message);
    // Send detection results to connected clients
    ws.send(JSON.stringify(predictions));
    console.log(predictions);
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Define a simple route for the HTTP server
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Vite!");
});
