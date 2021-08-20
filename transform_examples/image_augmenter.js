let size = 224; // image width and height 
let canvas = new OffscreenCanvas(size, size);
let ctx = canvas.getContext("2d");
ctx.save();

async function transform(data) {
  let blob = await data.fileHandle.getFile();
  let img = await createImageBitmap(blob);
  let name = data.fileHandle.name.split(".")[0];
  
  let outputs = [];
  let nameI = 0;

  let numAugmentationsPerImage = 500;

  for(let i = 0; i < numAugmentationsPerImage; i++) {
    ctx.restore();
    ctx.save(); // we need to save immediately after restoring because restoring pops the save off the stack, so we need a "save" for the next iteration of the loop: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/restore
    ctx.clearRect(0, 0, size, size);

    // random background:
    ctx.fillStyle = randomColor();
    ctx.fillRect(0, 0, size, size);
    if(r() < 0.5) {
      let gradient = ctx.createLinearGradient(r(-size, size*2), r(-size, size*2), r(-size, size*2), r(-size, size*2));
      gradient.addColorStop(0, randomColor());
      gradient.addColorStop(1, randomColor());
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    let transforms = [rotate, shift, scale, filter];
    shuffleArray(transforms);
    transforms.forEach(t => t());
    
    ctx.drawImage(img, 0, 0, size, size);
    
    outputs.push({
      blob: await canvas.convertToBlob({type: "image/jpeg"}),
      name: `${name.split(".")[0]}/${nameI++}.jpg`,
    });
  }

  return outputs;
}


function rotate() {
  let maxRotateDeg = 15;
  if(r() < 0.5) {
    ctx.translate(size/2, size/2);
    ctx.rotate((-maxRotateDeg + r()*maxRotateDeg*2) * (2*Math.PI/360));
    ctx.translate(-size/2, -size/2);
  }
}


function shift() {
  let maxShift = 0.4; // <-- fraction of size
  if(r() < 0.5) {
    ctx.translate(r(-size*maxShift, size*maxShift), r(-size*maxShift, size*maxShift));
  }    
}


function scale() {
  let minScale = 0.2;
  let maxScale = 1.35;
  if(r() < 1) {
    ctx.translate(size/2, size/2);
    if(r() < 0.2) { // chance of scaling independently, but if so, make the scaling closer to 1
      // subtract 1 to center around zero, then shrink, then add 1 to center around 1 again:
      let shrinkFactor = 0.7;
      ctx.scale((r(minScale, maxScale)-1)*shrinkFactor + 1, (r(minScale, maxScale)-1)*shrinkFactor + 1);
    } else {
      let xyScale = r(minScale, maxScale);
      ctx.scale(xyScale, xyScale);
    }
    ctx.translate(-size/2, -size/2);
  }
}


function filter() {
  if(r() < 0.5) {
    let filterStr = "";
    let filters = [
      () => { if(r() < 0.5) filterStr += ` hue-rotate(${-10+Math.floor(r()*20)}deg)`; },
      () => { if(r() < 0.5) filterStr += ` blur(${Math.floor(r()*7)}px)`; },
      () => { if(r() < 0.5) filterStr += ` grayscale(${r()*0.4})`; },
      () => { if(r() < 0.5) filterStr += ` brightness(${0.5+r()*1.5})`; },
      () => { if(r() < 0.5) filterStr += ` contrast(${0.5+r()*5})`; },
      () => { if(r() < 0.5) filterStr += ` saturate(${0.5+r()*5})`; },
    ];
    shuffleArray(filters);
    filters.forEach(f => f());
    ctx.filter = filterStr;
  }
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function randomColor() {
  return `rgb(${Math.floor(r()*255)}, ${Math.floor(r()*255)}, ${Math.floor(r()*255)})`;
}

function r(a, b) {
  if(a === undefined && b === undefined) {
    return Math.random();
  } else if(b === undefined) {
    return Math.random()*a;
  } else {
    if(b < a) throw new Error("Second param must be less than first.");
    return a + Math.random()*(b-a);
  }
}