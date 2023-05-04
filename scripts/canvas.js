// třída objektu, která obsahuje data konkrétního plátna a je zodpovědná za jeho zpracování
class Canvas {
  constructor(selectorOrElement, width, height) {
    this.targetElement =
      typeof selectorOrElement === "string"
        ? document.querySelector(selectorOrElement)
        : selectorOrElement;
    if (!this.targetElement) {
      throw new Error("Can't initialize canvas. Target element not found.");
    }
    this.width = width;
    this.height = height;
    this.canvasContext = this.targetElement.getContext("2d");
    _disableImageSmoothing(this.canvasContext);
    this.pixelsData = null;
    this.colorMode = null;
  }

  // aktualizuje plátno dle zadaných parametrů
  update() {
    this.clear();
    this.generate();
  }

  // vyčistí plátno
  clear() {
    this.canvasContext.clearRect(
      0,
      0,
      this.canvasContext.canvas.width,
      this.canvasContext.canvas.height
    );
  }

  // setter pro nastavení objektu pixelsData
  setPixelsData(pixelsData) {
    this.pixelsData = pixelsData;
  }

  // generuje výsledek na základě vybraných parametrů plátna
  generate() {
    if (!this.pixelsData) {
      return;
    }
    const imageData = this.pixelsData.generateImageData();
    const resultImageData = prepareImageData(
      imageData,
      this.width,
      this.height
    );
    this.canvasContext.putImageData(resultImageData, 0, 0);
  }
}

// objekt, který obsahuje data o obrázku (barvy jednotlivých pixelů, barvový model, šířka a výška)
class PixelsData {
  constructor(pixels, colorMode, width, height) {
    this.pixels = pixels;
    this.colorMode = colorMode;
    this.width = width;
    this.height = height;
  }

  // metoda pro získání barvy pixelu na zadaných souřadnicích
  getPixel(x, y) {
    return this.pixels[y * this.width + x];
  }

  // metoda pro získání hodnot jednoho z komponent barvy pixelů
  getComponentValues(component) {
    return this.pixels.map((x) => x[component]);
  }

  // metoda pro kovertaci barvového modelu objektu. Vrací nový objekt s novými daty.
  convertToColorMode(colorMode) {
    if (this.colorMode === colorMode) return this;
    const pixels = convertPixels(this.pixels, this.colorMode, colorMode);
    return new PixelsData(pixels, colorMode, this.width, this.height);
  }

  // metoda pro změnu barvového modelu pixelů v objektu
  changeColorMode(colorMode) {
    if (this.colorMode === colorMode) return;
    this.pixels = convertPixels(this.pixels, this.colorMode, colorMode);
    this.colorMode = colorMode;
  }

  // metoda pro získání ImageData objektu
  generateImageData() {
    return getFilledImageData(
      this.pixels,
      this.colorMode,
      this.width,
      this.height
    );
  }

  // metoda pro pridaní hodnot pixelů do objektu na zadaných souřadnicích bloku
  addPixelValues(values, blockRow, blockCol, blockWidth, blockHeight, fillOnlyComponents = null) {
    if (fillOnlyComponents === null) {
      fillOnlyComponents = COLOR_MODE_COMPONENTS[this.colorMode];
    }
    for (let row = 0; row < blockHeight; row++) {
      for (let col = 0; col < blockWidth; col++) {
        const index =
          (row + blockRow * blockHeight) * this.width +
          col +
          blockCol * blockWidth;
        this.pixels[index] = createPixelWithComponents(
          values[row * blockWidth + col],
          this.colorMode,
          row + blockRow * blockHeight,
          col + blockCol * blockWidth,
          fillOnlyComponents
        );
      }
    }
  }

  // metoda pro pridaní pixelů do objektu na zadaných souřadnicích bloku
  addPixels(pixels, blockRow, blockCol, blockWidth, blockHeight) {
    for (let row = 0; row < blockHeight; row++) {
      for (let col = 0; col < blockWidth; col++) {
        const index =
          (row + blockRow * blockHeight) * this.width +
          col +
          blockCol * blockWidth;
        this.pixels[index] = pixels[row * blockWidth + col];
      }
    }
  }
  // metoda pro vytvoření kopie objektu (bez referencí na původní objekt)
  clone() {
    return new PixelsData(
      this.pixels.map((x) => cloneObject(x)),
      this.colorMode,
      this.width,
      this.height,
    );
  }
  // metoda pro vytvoření objektu z hodnot jednotlivých pixelů
  static fromValues(
    values,
    colorMode,
    width,
    height,
    fillOnlyComponents = null
  ) {
    if (fillOnlyComponents === null) {
      fillOnlyComponents = COLOR_MODE_COMPONENTS[colorMode];
    }
    const pixels = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const index = i * height + j;
        const pixel = createPixelWithComponents(
          values[index],
          colorMode,
          i,
          j,
          fillOnlyComponents
        );
        pixels.push(pixel);
      }
    }
    return new PixelsData(pixels, colorMode, width, height);
  }

  // metoda pro vytvoření objektu z ImageData objektu
  static fromImageData(imageData, colorMode) {
    const pixels = getPixels(imageData, colorMode);
    return new PixelsData(pixels, colorMode, imageData.width, imageData.height);
  }
}

// pomocná metoda pro pripravení ImageData objektu pro vykreslení na plátno
const prepareImageData = (sourceData, canvasWidth, canvasHeight) => {
  const scale = Math.min(
    canvasWidth / sourceData.width,
    canvasHeight / sourceData.height
  );
  if (scale !== 1) {
    sourceData = resizeImageData(sourceData, scale);
  }
  return sourceData;
};

// zvětšení ImageData objektu do zadaného měřítka
const resizeImageData = (sourceImageData, scale) => {
  const tempCanvas = createCanvas(
    sourceImageData.width * scale,
    sourceImageData.height * scale
  );
  const tempCtx = tempCanvas.getContext("2d");
  _disableImageSmoothing(tempCtx);
  tempCtx.putImageData(sourceImageData, 0, 0);
  const scaleCanvas = createCanvas(
    sourceImageData.width * scale,
    sourceImageData.height * scale
  );
  const scaleCtx = scaleCanvas.getContext("2d");
  _disableImageSmoothing(scaleCtx);
  scaleCtx.scale(scale, scale);
  scaleCtx.drawImage(tempCanvas, 0, 0);
  return scaleCtx.getImageData(0, 0, scaleCanvas.width, scaleCanvas.height);
};

// konverze pixelů z jednoho barvového modelu do druhého
const convertPixels = (pixels, fromMode, toMode) => {
  const convertFunction = getConvertFunction(fromMode, toMode);
  return pixels.map((pixel) => convertFunction(pixel));
};

// získání konverzní funkce dle zadaných barvových modelů
const getConvertFunction = (fromMode, toMode) => {
  if (fromMode === COLOR_MODES.RGB && toMode === COLOR_MODES.YCC)
    return convertRGBtoYCC;
  if (fromMode === COLOR_MODES.YCC && toMode === COLOR_MODES.RGB)
    return convertYCCtoRGB;
};

// vytvoření objektu ImageData z hodnot pixelů
const getFilledImageData = (pixels, colorMode, width, height) => {
  let imageData = createImageData(width, height);
  for (const pixelObject of pixels) {
    const pixel = pick(pixelObject, COLOR_MODE_COMPONENTS[colorMode]);
    pushPixelToImageData(imageData, pixel, pixelObject.col, pixelObject.row);
  }
  return imageData;
};

// přidává hodnoty pixelů v seznam imageData na správné místo
const pushPixelToImageData = (imageData, pixel, col, row) => {
  const index = (col + row * imageData.width) * 4;
  for (const [i, value] of [...Object.values(pixel), 255].entries()) {
    imageData.data[index + i] = value;
  }
};

// vrací objekt pixelu s zadanými komponentami a hodnotami
const createPixelWithComponents = (
  value,
  colorMode,
  row,
  column,
  fillComponents
) => {
  const pixel = {};
  const components = COLOR_MODE_COMPONENTS[colorMode];
  const defaultPixelValue = colorMode === COLOR_MODES.YCC ? 128 : 0;
  components.forEach((comp) => {
    pixel[comp] = fillComponents.includes(comp) ? value : defaultPixelValue;
    pixel.row = row;
    pixel.col = column;
  });
  return pixel;
};

// vrací objekt pixelsData získaný z pixelů objektu ImageData
const getPixels = (imageData, colorMode) => {
  const components = COLOR_MODE_COMPONENTS[colorMode];
  let pixels = [];
  for (let row = 0; row < imageData.height; row++) {
    for (let col = 0; col < imageData.width; col++) {
      let pixel = getPixel(imageData, col, row, components);
      pixels.push(pixel);
    }
  }
  return pixels;
};

// vrací hodnoty modelu RGB u zvoleného pixelu
const getPixel = (imageData, col, row, components) => {
  let data = imageData.data;
  const index = (col + row * imageData.width) * 4;
  return {
    col: col,
    row: row,
    ...components.reduce((acc, component, i) => {
      acc[component] = data[index + i];
      return acc;
    }, {}),
  };
};

// vrací nový objekt plátna
const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

// vrací nový objekt ImageData
const createImageData = (width, height) => {
  const ctx = createCanvas(width, height).getContext("2d");
  return ctx.createImageData(width, height);
};

// pomocná metoda pro vypnutí rozmazání plátna
const _disableImageSmoothing = (ctx) => {
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
};
