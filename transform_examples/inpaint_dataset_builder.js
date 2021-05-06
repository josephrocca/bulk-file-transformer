let canvas = new OffscreenCanvas(512, 256);
let ctx = canvas.getContext("2d");

async function transform(inputData) {
  let blob = await inputData.fileHandle.getFile();

  let inputImageBlob = blob;
  ctx.fillStyle = "#000000";
  ctx.clearRect(0, 0, 512, 256);

  let img = await createImageBitmap(inputImageBlob);
  ctx.drawImage(img, 0, 0, 256, 256);

  let chunkCenter = {x:rI(0, 256), y:rI(0, 256)};
  let chunkSize = {x:rI(30, 128), y:rI(30, 128)};
  let chunkTopLeft = {x:chunkCenter.x-chunkSize.x/2, y:chunkCenter.y-chunkSize.y/2};
  
  ctx.fillStyle = "#00FF00";
  ctx.fillRect(chunkTopLeft.x, chunkTopLeft.y, chunkSize.x, chunkSize.y);

  // Must draw this right image last! in case chunk "overflows" from left image
  ctx.drawImage(img, 256, 0, 256, 256);

  let i = inputData.i;
  let n = inputData.n;
  let ratio = i/n;
  let folder, name;
  if(ratio < 0.6) {
    folder = "train";
    name = `${i}.jpg`;
  } else if(ratio < 0.8) {
    folder = "test";
    name = `${i - Math.ceil(0.6*n)}.jpg`;
  } else {
    folder = "val";
    name = `${i - Math.ceil(0.8*n)}.jpg`;
  }

  if(inputData.path.length > 0) throw new Error("This transform assumes that the input folder does not contain sub-folders.");

  return {
    blob: await canvas.convertToBlob({type: "image/jpeg"}),
    name: `${folder}/${name}`,
  };
}

function r(min=0, max) {
  if(max === undefined) {
    max = min;
    min = 0;
  }
  return min + (max-min)*Math.random();
}

function rI(min, max) {
  return Math.round(min + (max-min)*Math.random());
}
