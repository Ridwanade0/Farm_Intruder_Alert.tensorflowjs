import { useRef, useState, useEffect } from "react";

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null); // State to hold WebSocket connection
  const [frameData, setFrameData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newWs = new WebSocket("ws://localhost:3000"); // Replace with your WebSocket server URL

    newWs.onopen = () => {
      console.log("WebSocket connected");
      setWs(newWs);
    };

    newWs.onclose = () => {
      console.log("WebSocket disconnected");
    };

    newWs.onerror = (error) => {
      console.error("WebSocket error: ", error);
    };

    // Handle incoming messages from WebSocket server
    newWs.onmessage = (event) => {
      console.log("WebSocket message received: ", event.data);
      // Handle incoming messages as needed
    };

    return () => {
      // Clean up WebSocket connection on component unmount
      newWs.close();
    };
  }, []);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error("Error accessing the camera: ", err);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  const handleVideoProcessing = () => {
    if (videoRef.current && canvasRef.current && ws) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert canvas image to JPEG data
        const jpegData = canvas.toDataURL("image/jpeg");

        // Convert JPEG data to Uint8Array
        const base64String = jpegData.split(",")[1]; // Remove the data URL prefix
        const decodedData = atob(base64String);
        const dataArray = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; ++i) {
          dataArray[i] = decodedData.charCodeAt(i);
        }

        // Send frame data to WebSocket server
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(dataArray);
        }
      }
    }
  };


  useEffect(() => {
    const interval = setInterval(() => {
      if (isCameraOn) {
        handleVideoProcessing();
      }
    }, 500); // Process frame every 1/2 second

    return () => clearInterval(interval);
  }, [isCameraOn, ws]);

  return (
    <div className="">
      <div className="w-7/12 mx-auto">
        <h1 className="text-3xl font-bold text-center">Camera Feed</h1>
        <div className="flex flex-row gap-3 p-3 justify-center items-center h-auto">
          <button
            className="rounded-lg bg-blue-600 text-white p-2"
            onClick={handleStartCamera}
            disabled={isCameraOn}
          >
            Start Camera
          </button>
          <button
            className="rounded-lg bg-red-600 text-white p-2"
            onClick={handleStopCamera}
            disabled={!isCameraOn}
          >
            Stop Camera
          </button>
        </div>
        <div className="w-full h-[calc(100vh-300px)] bg-slate-200 border">
          <video
            ref={videoRef}
            className="w-full border h-full"
            autoPlay
          ></video>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default App;
