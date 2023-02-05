// todo remove unused

// generuje kvantizační matici dle zvolené kvality
const generateQuantizationMatrix = (quality) => {
  const matrix = new Array(64);
  if (quality >= 100) {
    return matrix.fill(1);
  }
  const factor = quality < 51 ? 50 / quality : 2 - 2 / quality;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      matrix[row * 8 + col] = QUANTIZATION_MATRIX[row * 8 + col] * factor;
    }
  }
  return matrix;
};

// aplikuje DCT na blok pixelů
const applyDCT = (block) => {
  const result = new Array(64);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let sum = 0;
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          sum +=
            block[x][y] *
            Math.cos(((2 * x + 1) * i * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * j * Math.PI) / 16);
        }
      }
      sum *=
        ((i === 0 ? 1 / Math.sqrt(2) : 1) * (j === 0 ? 1 / Math.sqrt(2) : 1)) /
        4;
      result[i * 8 + j] = sum;
    }
  }
  return result;
};

// aplikuje kvantizaci na blok pixelů
const applyQuantization = (block, quality) => {
  const matrix = generateQuantizationMatrix(quality);
  const result = new Array(64);
  for (let i = 0; i < 64; i++) {
    result[i] = block[i] / matrix[i];
  }
  return result;
};

// aplikuje dekvantizaci na blok pixelů
const applyDequantization = (block, quality) => {
  const matrix = generateQuantizationMatrix(quality);
  const result = new Array(64);
  for (let i = 0; i < 64; i++) {
    result[i] = block[i] * matrix[i];
  }
  return result;
};

// aplikuje IDCT na blok pixelů
const applyIDCT = (block) => {
  const result = new Array(64);
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          sum +=
            (((i === 0 ? 1 / Math.sqrt(2) : 1) *
              (j === 0 ? 1 / Math.sqrt(2) : 1)) /
              4) *
            block[i * 8 + j] *
            Math.cos(((2 * x + 1) * i * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * j * Math.PI) / 16);
        }
      }
      result[x * 8 + y] = sum;
    }
  }
  return result;
};

// vrací objekt s YCbCr komponentami po konverzi z RGB
function convertRGBtoYCC(pixel) {
  const r = pixel.r;
  const g = pixel.g;
  const b = pixel.b;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;
  return { y, cb, cr, row: pixel.row, col: pixel.col };
}

// vrací objekt s RGB komponentami po konverzi z YCbCr
function convertYCCtoRGB(pixel) {
  const y = pixel.y;
  const cb = pixel.cb;
  const cr = pixel.cr;
  const r = y + 1.402 * (cr - 128);
  const g = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128);
  const b = y + 1.772 * (cb - 128);
  return { r, g, b, row: pixel.row, col: pixel.col };
}

// vrací bloky pixelů podle zvoleného schématu podvzorkování
const getChunksByScheme = (array, subsamplingScheme, width) => {
  if (subsamplingScheme === "4:2:2") {
    return getGrid(array, 2);
  } else if (subsamplingScheme === "4:4:4") {
    return getGrid(array, 1);
  } else if (subsamplingScheme === "4:2:0") {
    const squares = getSquares(array, 2, width);
    return squares;
  }
  return [];
};

// aplikuje podvzorkování na blok pixelů
const applySubsamplingToChunk = (chunk) => {
  let subsampledPixels = [];
  const avgCB = getAverageOfComponent(chunk, "cb");
  const avgCR = getAverageOfComponent(chunk, "cr");
  for (const pixelYCC of chunk) {
    pixelYCC.cb = avgCB;
    pixelYCC.cr = avgCR;
    subsampledPixels.push(pixelYCC);
  }
  return subsampledPixels;
};

// vrací průměrnou hodnotu zvolené složky
function getAverageOfComponent(pixels, component) {
  const componentValues = pixels.map((x) => x[component]);
  const sum = componentValues.reduce((a, b) => a + b, 0);
  return sum / pixels.length;
}

// vrací objekt ImageData z obrázku dle zadané cesty
const getImageDataFromImage = (filePath) => {
  const image = createImageElement(filePath);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

// vytvoří nový element img a nastaví mu zadanou cestu
function createImageElement(fileName) {
  const image = document.createElement("img");
  image.src = fileName;
  return image;
}
