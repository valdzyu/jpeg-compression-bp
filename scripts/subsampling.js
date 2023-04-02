// výchozí schématy a barevné složky pro plátna
const DEFAULT_ORIGINAL_RGB_TRANSFORMATION = "original";
const DEFAULT_YCC_TRANSFORMATION = "y";
const DEFAULT_SUBSAMPLING_SCHEME = "4:4:4";
const DEFAULT_SUBSAMPLING_TRANSFORMATION = "y";
const DEFAULT_RESULT_RGB_TRANSFORMATION = "original";

// třída kontrolující DCT aplet
class SubsamplingAppletController {
  constructor() {
    this.originalColorValue = DEFAULT_ORIGINAL_RGB_TRANSFORMATION;
    this.transformationColorValue = DEFAULT_YCC_TRANSFORMATION;
    this.subsamplingSchemeValue = DEFAULT_SUBSAMPLING_SCHEME;
    this.subsamplingColorValue = DEFAULT_SUBSAMPLING_TRANSFORMATION;
    this.resultColorValue = DEFAULT_RESULT_RGB_TRANSFORMATION;
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
    this.originalCanvas = new Canvas(
      "#originalCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.transformationYCCCanvas = new Canvas(
      "#transformationCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.subsamplingCanvas = new Canvas(
      "#subsamplingCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.resultCanvas = new Canvas(
      "#resultCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.updateWorkingCanvases();
  }

  // aktualizace všech pláten při změně obrázku
  updateWorkingCanvases() {
    this.updateOriginalCanvas();
    this.updateTransformationCanvas();
    this.updateSubsamplingCanvas();
    this.updateResultCanvas();
  }

  // aktualizace plátna s RGB transformací
  updateOriginalCanvas() {
    const transformationPixelsData = getOriginalPixelsData(
      this.originalPixelsData,
      this.originalColorValue
    );
    this.originalCanvas.setPixelsData(transformationPixelsData);
    this.originalCanvas.update();
  }

  // aktualizace plátna s YCC transformací
  updateTransformationCanvas() {
    const transformationPixelsData = getTransformationPixelsData(
      this.originalPixelsData,
      this.transformationColorValue
    );
    this.transformationYCCCanvas.setPixelsData(transformationPixelsData);
    this.transformationYCCCanvas.update();
  }

  // aktualizace plátna s podvzorkováním
  updateSubsamplingCanvas() {
    const subsamplingPixelsData = getSubsamplingPixelsData(
      this.originalPixelsData,
      this.subsamplingSchemeValue,
      this.subsamplingColorValue
    );
    this.subsamplingCanvas.setPixelsData(subsamplingPixelsData);
    this.subsamplingCanvas.update();
  }

  // aktualizace plátna s výsledným obrázkem
  updateResultCanvas() {
    const resultPixelsData = getResultPixelsData(
      this.originalPixelsData,
      this.subsamplingSchemeValue,
      this.resultColorValue
    );
    this.resultCanvas.setPixelsData(resultPixelsData);
    this.resultCanvas.update();
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
        case "originalColor-select":
          valueAttrName = "originalColorValue";
          updateFunctionName = ["updateOriginalCanvas"];
          break;
        case "transformationColor-select":
          valueAttrName = "transformationColorValue";
          updateFunctionName = ["updateTransformationCanvas"];
          break;
        case "subsamplingScheme-select":
          valueAttrName = "subsamplingSchemeValue";
          updateFunctionName = ["updateSubsamplingCanvas", "updateResultCanvas"];
          break;
        case "subsamplingColor-select":
          valueAttrName = "subsamplingColorValue";
          updateFunctionName = ["updateSubsamplingCanvas"];
          break;
        case "resultColor-select":
          valueAttrName = "resultColorValue";
          updateFunctionName = ["updateResultCanvas"];
          break;
      }
      if (valueAttrName && updateFunctionName)
        radioButton.addEventListener("change", (e) => {
          this[valueAttrName] = e.target.value;
          for (const functionName of updateFunctionName) {
            this[functionName]();
          }
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
      this.originalCanvas.targetElement,
      this.transformationYCCCanvas.targetElement,
      this.subsamplingCanvas.targetElement,
      this.resultCanvas.targetElement,
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
const getOriginalPixelsData = (
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
const getTransformationPixelsData = (
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
  applySubsamplingToChunks(chunks, subsamplingScheme, resultPixelsData);
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

// získání objektu PixelsData s pixely po aplikaci podvzorkování a transformace
const getResultPixelsData = (
  pixelsData,
  subsamplingScheme,
  transformationComponent
) => {
  pixelsData = pixelsData.convertToColorMode(COLOR_MODES.YCC);
  let resultPixelsData = new PixelsData(
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
  applySubsamplingToChunks(chunks, subsamplingScheme, resultPixelsData);
  resultPixelsData.changeColorMode(COLOR_MODES.RGB);
  if (transformationComponent === "original") {
    return resultPixelsData
  }
  const componentValues = resultPixelsData.getComponentValues(
    transformationComponent
  );
  return PixelsData.fromValues(
    componentValues,
    COLOR_MODES.RGB,
    pixelsData.width,
    pixelsData.height,
    transformationComponent
  );
};
