import { useRef, useState, useEffect } from "react";

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const newWs = new WebSocket("ws://localhost:3000");

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

    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPredictions(data);
    };

    return () => {
      newWs.close();
    };
  }, []);

  useEffect(() => {
    const getDevices = async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    };

    getDevices();
  }, []);

  const handleStartCamera = async () => {
    if (selectedDeviceId) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { deviceId: selectedDeviceId } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraOn(true);
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
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

        const jpegData = canvas.toDataURL("image/jpeg");
        const base64String = jpegData.split(",")[1];
        const decodedData = atob(base64String);
        const dataArray = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; ++i) {
          dataArray[i] = decodedData.charCodeAt(i);
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(dataArray);
        }
      }
    }
  };

  const drawBoundingBoxes = (predictions: any[]) => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        predictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;

          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = "red";
          ctx.font = "16px Arial";
          ctx.fillText(
            `Class: ${prediction.class}, Confidence: ${(prediction.score * 100).toFixed(2)}%`,
            x + 5,
            y + 20
          );
        });
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isCameraOn) {
        handleVideoProcessing();
        drawBoundingBoxes(predictions); // Draw bounding boxes only when new predictions are available
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCameraOn, ws, predictions]);

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
          <select 
            onChange={(e) => setSelectedDeviceId(e.target.value)} 
            disabled={isCameraOn}
            className="rounded-lg p-2"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full h-[calc(100vh-300px)] bg-slate-200 border relative">
          <video
            ref={videoRef}
            className="w-full border h-full"
            autoPlay
          ></video>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          ></canvas>
        </div>
      </div>
    </div>
  );
};

export default App;
