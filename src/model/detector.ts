import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as jpeg from "jpeg-js";

const readImage = async (buf: Buffer) => {
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
  const imageTensor = await readImage(imageBuffer);
  let predictions;
  try {
    const model = await cocoSsd.load();
    predictions = await model.detect(imageTensor);
    console.log("Predictions:", predictions);
  } finally {
    // Dispose of the tensor to free memory
    imageTensor.dispose();
  }
  return predictions;
};

export default detectObjects;
