import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as jpeg from "jpeg-js";

let model: cocoSsd.ObjectDetection | null = null;

const loadModel = async () => {
  if (!model) {
    model = await cocoSsd.load();
    console.log("Model loaded");
  }
};


const readImage = (buf: Buffer): tf.Tensor3D => {
  const pixels = jpeg.decode(buf, { useTArray: true });

  const numChannels = 3;
  const numPixels = pixels.width * pixels.height;
  const values = new Int32Array(numPixels * numChannels);

  for (let i = 0; i < numPixels; i++) {
    for (let c = 0; c < numChannels; ++c) {
      values[i * numChannels + c] = pixels.data[i * 4 + c];
    }
  }

  const tensor = tf.tensor3d(
    values,
    [pixels.height, pixels.width, numChannels],
    "int32"
  );
  return tensor;
};

const detectObjects = async (imageBuffer: Buffer) => {
  await loadModel(); 

  const imageTensor = readImage(imageBuffer); 
  let predictions;
  try {
    predictions = await model!.detect(imageTensor);
  } finally {
    tf.dispose(imageTensor); 
  }
  return predictions;
};

export default detectObjects;
