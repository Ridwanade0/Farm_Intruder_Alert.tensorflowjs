import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as fs from "fs";
import * as jpeg from "jpeg-js";

const readImage = (path: string) => {
    const buf = fs.readFileSync(path);
    console.log(buf.toJSON())
  const pixels = jpeg.decode(buf, { useTArray: true });

  const numChannels = 3;
  const numPixels = pixels.width * pixels.height;
  const values = new Int32Array(numPixels * numChannels);
  console.log(numPixels, "values.length");

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

const detectObjects = async (imagePath: string) => {
  const imageTensor = readImage(imagePath);
  try {
    const model = await cocoSsd.load();
    const predictions = await model.detect(imageTensor);

    // Log the first prediction class and score percentage
    if (predictions.length > 0) {
      console.log(
        "Predictions:",
        predictions[0].class,
        predictions[0].score * 100
      );
    } else {
      console.log("No objects detected.");
    }
  } finally {
    // Dispose of the tensor to free memory
    imageTensor.dispose();
  }
};

detectObjects("./src/image.jpg");
