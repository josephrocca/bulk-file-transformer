let size = 224; // image width/height
let canvas = new OffscreenCanvas(size, size);
let ctx = canvas.getContext("2d");
ctx.save();

async function transform(data) {
  let blob = await data.fileHandle.getFile();
  let img = await createImageBitmap(blob);
  let name = data.fileHandle.name.split(".")[0];
  
  let outputs = [];
  let nameI = 0;

  let numAugmentationsPerImage = 1000;

  for(let i = 0; i < numAugmentationsPerImage; i++) {
    ctx.restore();
    ctx.save(); // we need to save immediately after restoring because restoring pops the save off the stack, so we need a "save" for the next iteration of the loop: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/restore
    ctx.clearRect(0, 0, size, size);

    let transforms = [rotate, shift, scale, filter];
    shuffleArray(transforms);
    transforms.forEach(t => t());
    
    ctx.drawImage(img, 0, 0, size, size);
    
    outputs.push({
      blob: await canvas.convertToBlob({type: "image/jpeg"}),
      name: (name+"-!-"+nameI++)+".jpg",
    });
  }

  return outputs;
}


function rotate() {
  let maxRotateDeg = 15;
  if(Math.random() < 0.5) {
    ctx.translate(size/2, size/2);
    ctx.rotate((-maxRotateDeg + Math.random()*maxRotateDeg*2) * (2*Math.PI/360));
    ctx.translate(-size/2, -size/2);
  }
}


function shift() {
  let maxShift = 0.2; // <-- fraction of size
  if(Math.random() < 0.5) {
    ctx.translate(-size*maxShift + Math.random()*size*maxShift*2, -size*maxShift + Math.random()*size*maxShift*2);
  }    
}


function scale() {
  let maxScale = 0.7; // <-- fraction of size
  ctx.scale(Math.random() < 0.5 ? (1-maxScale)+Math.random()*maxScale*2 : 1, Math.random() < 0.5 ? (1-maxScale)+Math.random()*maxScale*2 : 1);
}


function filter() {
  if(Math.random() < 0.7) {
    let filterStr = "";
    let filters = [
      () => { if(Math.random() < 0.5) filterStr += ` hue-rotate(${-10+Math.floor(Math.random()*20)}deg)`; },
      () => { if(Math.random() < 0.5) filterStr += ` blur(${Math.floor(Math.random()*7)}px)`; },
      () => { if(Math.random() < 0.5) filterStr += ` grayscale(${Math.random()*0.4})`; },
      () => { if(Math.random() < 0.5) filterStr += ` brightness(${0.5+Math.random()*1.5})`; },
      () => { if(Math.random() < 0.5) filterStr += ` contrast(${0.5+Math.random()*5})`; },
      () => { if(Math.random() < 0.5) filterStr += ` saturate(${0.5+Math.random()*5})`; },
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