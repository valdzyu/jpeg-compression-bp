// výchozí schématy a barevné složky pro plátna
const DEFAULT_RGB_TRANSFORMATION = "original";
const DEFAULT_YCC_TRANSFORMATION = "y";
const DEFAULT_SUBSAMPLING_SCHEME = "4:4:4";
const DEFAULT_SUBSAMPLING_TRANSFORMATION = "original";

// třída kontrolující DCT aplet
class SubsamplingController {
  constructor() {
    this.transformationRGBValue = DEFAULT_RGB_TRANSFORMATION;
    this.transformationYCCValue = DEFAULT_YCC_TRANSFORMATION;
    this.subsamplingScheme = DEFAULT_SUBSAMPLING_SCHEME;
    this.subsamplingTransformationValue = DEFAULT_SUBSAMPLING_TRANSFORMATION;
    this.originalPixelsData = null;
  }

  // inicializace všech potřebných prvků apletu
  init() {
    this.initCanvases();
    this.initCanvasControls();
    this.initImageSelector();
    this.initZoom();
  }

  // vkládá počáteční data do pláten
  initCanvases() {
    this.setImage(DEFAULT_SOURCE_FILE_NAME);
    this.transformationRGBCanvas = new Canvas(
      "#transformationRGBCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.transformationYCCCanvas = new Canvas(
      "#transformationYCCCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.subsamplingCanvas = new Canvas(
      "#subsamplingCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.updateWorkingCanvases();
  }

  // aktualizace všech pláten při změně obrázku
  updateWorkingCanvases() {
    this.updateTransformationRGBCanvas();
    this.updateTransformationYCCCanvas();
    this.updateSubsamplingCanvas();
  }

  // aktualizace plátna s RGB transformací
  updateTransformationRGBCanvas() {
    const transformationPixelsData = getTransformationRGBPixelsData(
      this.originalPixelsData,
      this.transformationRGBValue
    );
    this.transformationRGBCanvas.setPixelsData(transformationPixelsData);
    this.transformationRGBCanvas.update();
  }

  // aktualizace plátna s YCC transformací
  updateTransformationYCCCanvas() {
    const transformationPixelsData = getTransformationYCCPixelsData(
      this.originalPixelsData,
      this.transformationYCCValue
    );
    this.transformationYCCCanvas.setPixelsData(transformationPixelsData);
    this.transformationYCCCanvas.update();
  }

  // aktualizace plátna s podvzorkováním
  updateSubsamplingCanvas() {
    const subsamplingPixelsData = getSubsamplingPixelsData(
      this.originalPixelsData,
      this.subsamplingScheme,
      this.subsamplingTransformationValue
    );
    this.subsamplingCanvas.setPixelsData(subsamplingPixelsData);
    this.subsamplingCanvas.update();
  }

  // nastavuje jak se mají chovat jednotlivé typy přepínačů u pláten
  initCanvasControls() {
    const canvasControlButtons = document.querySelectorAll(
      'form.canvas-control.form > input[type="radio"]'
    );
    for (const radioButton of canvasControlButtons) {
      let valueAttrName;
      let updateFunctionName;
      switch (radioButton.getAttribute("name")) {
        case "transformationRGB-select":
          valueAttrName = "transformationRGBValue";
          updateFunctionName = "updateTransformationRGBCanvas";
          break;
        case "transformationYCC-select":
          valueAttrName = "transformationYCCValue";
          updateFunctionName = "updateTransformationYCCCanvas";
          break;
        case "subsampling-scheme-control":
          valueAttrName = "subsamplingScheme";
          updateFunctionName = "updateSubsamplingCanvas";
          break;
        case "subsampling-transformation-select":
          valueAttrName = "subsamplingTransformationValue";
          updateFunctionName = "updateSubsamplingCanvas";
          break;
      }
      if (valueAttrName && updateFunctionName)
        radioButton.addEventListener("change", (e) => {
          this[valueAttrName] = e.target.value;
          this[updateFunctionName]();
        });
    }
  }

  // nastavuje přepínače pro výběr zdrojového obrazu
  initImageSelector() {
    const imagesSelector = document.querySelector("form.image-control");
    imagesSelector.addEventListener("change", (e) => {
      const imageName = e.target.value;
      this.setImage(imageName);
      this.updateWorkingCanvases();
    });
  }

  // inicializuje lupy a nastavuje jejich parametry
  initZoom() {
    const canvases = [
      this.transformationRGBCanvas.targetElement,
      this.transformationYCCCanvas.targetElement,
      this.subsamplingCanvas.targetElement,
    ];
    initMultipleZoom(canvases);
  }

  // nastaví nový vstupní obrázek
  setImage(imageName) {
    const imagePath = generateImagePath(imageName);
    const imageData = getImageDataFromImage(imagePath);
    this.originalPixelsData = PixelsData.fromImageData(
      imageData,
      COLOR_MODES.RGB
    );
  }
}

// získání objektu PixelsData s pixely po RGB transformaci
const getTransformationRGBPixelsData = (
  pixelsData,
  transformationComponent
) => {
  if (transformationComponent === "original") {
    return pixelsData;
  }
  const componentValues = pixelsData.getComponentValues(
    transformationComponent
  );
  return PixelsData.fromValues(
    componentValues,
    COLOR_MODES.RGB,
    pixelsData.width,
    pixelsData.height,
    [transformationComponent]
  );
};

// získání objektu PixelsData s pixely po RGB transformaci
const getTransformationYCCPixelsData = (
  pixelsData,
  transformationComponent
) => {
  pixelsData = pixelsData.convertToColorMode(COLOR_MODES.YCC);
  const componentValues = pixelsData.getComponentValues(
    transformationComponent
  );
  return PixelsData.fromValues(
    componentValues,
    COLOR_MODES.YCC,
    pixelsData.width,
    pixelsData.height
  );
};

// získání objektu PixelsData s pixely po podvzorkování a transformaci
const getSubsamplingPixelsData = (
  pixelsData,
  subsamplingScheme,
  transformationComponent
) => {
  pixelsData = pixelsData.convertToColorMode(COLOR_MODES.YCC);
  const resultPixelsData = new PixelsData(
    [],
    COLOR_MODES.YCC,
    pixelsData.width,
    pixelsData.height
  );
  const chunks = getChunksByScheme(
    pixelsData.pixels,
    subsamplingScheme,
    pixelsData.width
  );
  for (const chunk of chunks) {
    if (subsamplingScheme === "4:2:0") {
      const chunkAfterSubsampling = applySubsamplingToChunk(chunk.square);
      resultPixelsData.addPixels(
        chunkAfterSubsampling,
        chunk.squareRow,
        chunk.squareCol,
        2,
        2
      );
    } else {
      const chunkAfterSubsampling = applySubsamplingToChunk(chunk);
      resultPixelsData.pixels.push(...chunkAfterSubsampling);
    }
  }
  if (transformationComponent === "original") {
    return resultPixelsData.convertToColorMode(COLOR_MODES.RGB);
  }
  const componentValues = resultPixelsData.getComponentValues(
    transformationComponent
  );
  return PixelsData.fromValues(
    componentValues,
    COLOR_MODES.YCC,
    pixelsData.width,
    pixelsData.height
  );
};
