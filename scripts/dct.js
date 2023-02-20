// rozmer jednoho bloku který uživatel vybere
const SELECT_PIXELS_AREA_SIZE = 8;

// hodnoty omezující kvalitu komprese
const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
// výchozí hodnota kvality komprese
const DEFAULT_QUALITY = 50;

// třída kontrolující DCT aplet
class DCTController {
  constructor() {
    this.quality = DEFAULT_QUALITY;
    this.selectedPixelsArea = {
      column: 0,
      row: 0,
    };
    this.originalPixelsData = null;
  }

  // inicializace všech potřebných prvků apletu
  init() {
    this.initCanvases();
    this.initControls();
    this.initZoom();
  }

  // inicializace ovládacích prvků apletu
  initControls() {
    this.initImagesSelector();
    this.initSlider();
    this.initPixelsSelector();
    this.initCanvasValuesDisplaySwitcher();
    this.initCanvasPixelsValues();
  }

  // inicializace ovladání výběru obrázku
  initImagesSelector() {
    const imagesSelector = document.querySelector("form.image-control");
    imagesSelector.addEventListener("change", (e) => {
      const imageName = e.target.value;
      this.setImage(imageName);
      this.updateOriginalCanvas();
      this.updateWorkingCanvases();
      this.updateResultCanvas();
    });
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

  // vytvoření všech pláten a jejich inicializace
  initCanvases() {
    this.setImage(DEFAULT_BW_SOURCE_FILE_NAME);
    this.originalCanvas = new Canvas(
      "#originalCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.originalCroppedCanvas = new Canvas(
      "#originalCroppedCanvas",
      SMALL_CANVAS_SIZE,
      SMALL_CANVAS_SIZE
    );
    this.dctCanvas = new Canvas(
      "#dctCanvas",
      SMALL_CANVAS_SIZE,
      SMALL_CANVAS_SIZE
    );
    this.quantizationCanvas = new Canvas(
      "#quantizationCanvas",
      SMALL_CANVAS_SIZE,
      SMALL_CANVAS_SIZE
    );
    this.dequantizationCanvas = new Canvas(
      "#dequantizationCanvas",
      SMALL_CANVAS_SIZE,
      SMALL_CANVAS_SIZE
    );
    this.idctCanvas = new Canvas(
      "#idctCanvas",
      SMALL_CANVAS_SIZE,
      SMALL_CANVAS_SIZE
    );
    this.resultCanvas = new Canvas(
      "#resultCanvas",
      MEDIUM_CANVAS_SIZE,
      MEDIUM_CANVAS_SIZE
    );
    this.initCanvasValuesGrids();
    this.updateOriginalCanvas();
    this.updateWorkingCanvases();
    this.updateResultCanvas();
  }

  // aktualizace pláten, která se mění při změně kvality komprese, výběru bloku nebo obrázku
  updateWorkingCanvases() {
    this.updateOriginalCroppedCanvas();
    this.updateDCTCanvas();
    this.updateQuantizationCanvas();
    this.updateDequantizationCanvas();
    this.updateIDCTCanvas();
  }

  // aktualizace plátna s výchozím obrázkem
  updateOriginalCanvas() {
    this.originalCanvas.setPixelsData(this.originalPixelsData, COLOR_MODES.RGB);
    this.originalCanvas.update();
  }

  // aktualizace plátna s vybraným blokem
  updateOriginalCroppedCanvas() {
    const croppedPixelsData = getCroppedPixelsData(
      this.originalPixelsData,
      this.selectedPixelsArea.row,
      this.selectedPixelsArea.column
    );
    this.originalCroppedCanvas.setPixelsData(croppedPixelsData);
    this.originalCroppedCanvas.update();
  }

  // aktualizace plátna s DCT transformací
  updateDCTCanvas() {
    const dctPixelsData = getDCTPixelsData(
      this.originalCroppedCanvas.pixelsData
    );
    this.dctCanvas.setPixelsData(dctPixelsData);
    this.dctCanvas.update();
    this.setCanvasPixelsValues(this.dctCanvas);
  }

  // aktualizace plátna s pixely po kvantizaci
  updateQuantizationCanvas() {
    const quantizationPixelsData = getQuantizationPixelsData(
      this.dctCanvas.pixelsData.originalValues,
      this.dctCanvas.pixelsData.width,
      this.dctCanvas.pixelsData.height,
      this.quality
    );
    this.quantizationCanvas.setPixelsData(
      quantizationPixelsData,
      COLOR_MODES.YCC
    );
    this.quantizationCanvas.update();
    this.setCanvasPixelsValues(this.quantizationCanvas);
  }

  // aktualizace plátna s pixely po dekvantizaci
  updateDequantizationCanvas() {
    const dequantizationPixelsData = getDequantizationPixelsData(
      this.quantizationCanvas.pixelsData.originalValues,
      this.quantizationCanvas.pixelsData.width,
      this.quantizationCanvas.pixelsData.height,
      this.quality
    );
    this.dequantizationCanvas.setPixelsData(dequantizationPixelsData);
    this.dequantizationCanvas.update();
    this.setCanvasPixelsValues(this.dequantizationCanvas);
  }

  // aktualizace plátna s pixely po IDCT transformací
  updateIDCTCanvas() {
    const idctPixelsData = getIDCTPixelsData(
      this.dequantizationCanvas.pixelsData.originalValues,
      this.dequantizationCanvas.pixelsData.width,
      this.dequantizationCanvas.pixelsData.height
    );
    this.idctCanvas.setPixelsData(idctPixelsData);
    this.idctCanvas.update();
  }

  // aktualizace plátna s výsledným obrázkem
  updateResultCanvas() {
    const resultPixelsData = getAllProcessingStepsPixelsData(
      this.originalPixelsData,
      this.quality
    );
    this.resultCanvas.setPixelsData(resultPixelsData);
    this.resultCanvas.update();
  }

  // nastavení posuvníku kvality komprese
  initSlider() {
    const qualityInput = document.querySelector("input#qualityInput");
    const qualitySlider = document.querySelector("input#qualitySlider");

    qualityInput.addEventListener("input", (e) => {
      qualitySlider.value = Math.max(
        Math.min(e.target.value, MAX_QUALITY),
        MIN_QUALITY
      );
    });
    qualitySlider.addEventListener("mousemove", (e) => {
      qualityInput.value = e.target.value;
    });
    qualityInput.addEventListener("change", (e) => {
      const value = Math.max(
        Math.min(e.target.value, MAX_QUALITY),
        MIN_QUALITY
      );
      qualitySlider.value = value;
      this.setQuality(value);
      this.updateWorkingCanvases();
      this.updateResultCanvas();
    });
    qualitySlider.addEventListener("change", (e) => {
      const value = e.target.value;
      qualityInput.value = value;
      this.setQuality(value);
      this.updateWorkingCanvases();
      this.updateResultCanvas();
    });
  }

  // nastavení ovládaní výběru bloku
  setupSelectPixelsArea() {
    const selectPixelsAreas = document.querySelectorAll(
      ".select-pixels-area-cell"
    );
    selectPixelsAreas.forEach((selectPixelsArea) => {
      selectPixelsArea.addEventListener("click", (event) => {
        selectPixelsAreas.forEach((selectPixelsArea) => {
          selectPixelsArea.classList.remove("selected");
        });
        const blockColumn = parseInt(event.target.getAttribute("data-column"));
        const blockRow = parseInt(event.target.getAttribute("data-row"));
        selectPixelsArea.classList.add("selected");
        this.setSelectedPixelsArea(blockColumn, blockRow);
        this.updateWorkingCanvases();
      });
    });
  }

  // inicializace ovládání výběru bloku
  initPixelsSelector() {
    const overlay = generateOverlayGrid({
      width: MEDIUM_CANVAS_SIZE,
      height: MEDIUM_CANVAS_SIZE,
      blockWidth: SELECT_PIXELS_AREA_SIZE,
      blockHeight: SELECT_PIXELS_AREA_SIZE,
      overlayClassNames: ["select-pixels-overlay"],
      blockClassNames: ["select-pixels-area-cell"],
    });
    addOverlayToCanvas(this.originalCanvas.targetElement, overlay);
    this.setupSelectPixelsArea();
  }

  // inicializace elementů pro zobrazení hodnot pixelů
  initCanvasValuesGrids() {
    const overlay = generateOverlayGrid({
      width: SMALL_CANVAS_SIZE,
      height: SMALL_CANVAS_SIZE,
      blockWidth: SMALL_CANVAS_SIZE / SELECT_PIXELS_AREA_SIZE,
      blockHeight: SMALL_CANVAS_SIZE / SELECT_PIXELS_AREA_SIZE,
      overlayClassNames: ["canvas-values-overlay", "hidden"],
      blockClassNames: ["canvas-values-grid-cell"],
    });
    addValuesElementsToOverlay(overlay);
    addOverlayToCanvas(this.dctCanvas.targetElement, overlay.cloneNode(true));
    addOverlayToCanvas(
      this.quantizationCanvas.targetElement,
      overlay.cloneNode(true)
    );
    addOverlayToCanvas(
      this.dequantizationCanvas.targetElement,
      overlay.cloneNode(true)
    );
  }

  // přidání zobrazení hodnot pixelů do vybraného plátna
  setCanvasPixelsValues(canvas) {
    const overlay =
      canvas.targetElement.parentElement.parentElement.querySelector(
        ".overlay"
      );
    const normalizedValues = normalizeValues(
      absoluteValues(canvas.pixelsData.originalValues)
    );
    const cells = overlay.querySelectorAll(
      ".canvas-values-grid-cell-value span"
    );
    cells.forEach((cell, index) => {
      const valueToDisplay = canvas.pixelsData.originalValues[index];
      const valueToCalculateColor = normalizedValues[index];
      if (valueToCalculateColor >= 0 && valueToCalculateColor <= 127) {
        cell.style.color = "white";
      } else {
        cell.style.color = "black";
      }
      cell.textContent = Math.round(valueToDisplay).toString();
    });
  }

  // inicializuje chování při najetí myši na buňku s hodnotou pixelu
  initCanvasPixelsValues() {
    const cells = document.querySelectorAll(".canvas-values-grid-cell");
    const cellsGroups = getCellsGroups(cells);
    cellsGroups.forEach((cellsGroup) => {
      cellsGroup.forEach((cell) => {
        cell.addEventListener("mouseover", () => {
          cellsGroup.forEach((cell) => {
            cell.classList.add("hovered");
          });
        });
        cell.addEventListener("mouseout", () => {
          cellsGroup.forEach((cell) => {
            cell.classList.remove("hovered");
          });
        });
      });
    });
  }

  // inicializace prvku pro ovládání zobrazení hodnot pixelů
  initCanvasValuesDisplaySwitcher() {
    const canvasValuesDisplaySwitcher = document.querySelector(
      "#canvasValuesDisplaySwitcher"
    );
    canvasValuesDisplaySwitcher.addEventListener("change", () => {
      const overlay = document.querySelectorAll(".canvas-values-overlay");
      overlay.forEach((overlay) => {
        overlay.classList.toggle("hidden");
      });
    });
  }

  // setter pro hodnotu kvality komprese
  setQuality(quality) {
    this.quality = quality;
  }

  // setter pro souřadnice vybraného bloku
  setSelectedPixelsArea(blockColumn, blockRow) {
    this.selectedPixelsArea = {
      column: blockColumn,
      row: blockRow,
    };
  }

  // inicializace lupy
  initZoom() {
    const canvases = [
      this.originalCanvas.targetElement,
      this.resultCanvas.targetElement,
    ];
    initMultipleZoom(canvases);
  }
}

// funkce pro vytvoření elementu mřížky, která se přidá nad plátno
const generateOverlayGrid = ({
  width,
  height,
  blockWidth,
  blockHeight,
  overlayClassNames,
  blockClassNames,
}) => {
  const columnsNumber = Math.ceil(width / blockWidth);
  const rowsNumber = Math.ceil(height / blockHeight);
  const overlay = document.createElement("div");
  overlay.classList.add("overlay", ...overlayClassNames);
  for (let row = 0; row < rowsNumber; row++) {
    let overlayRow = document.createElement("div");
    overlayRow.classList.add("overlay-row");
    for (let column = 0; column < columnsNumber; column++) {
      const selectPixelsArea = document.createElement("div");
      selectPixelsArea.classList.add("overlay-cell", ...blockClassNames);
      selectPixelsArea.style.setProperty(
        "width",
        `${blockWidth}px`,
        "important"
      );
      selectPixelsArea.style.setProperty(
        "height",
        `${blockHeight}px`,
        "important"
      );
      selectPixelsArea.setAttribute("data-column", column.toString());
      selectPixelsArea.setAttribute("data-row", row.toString());

      overlayRow.appendChild(selectPixelsArea);
    }
    overlay.appendChild(overlayRow);
  }
  return overlay;
};

// funkce pro vložení elementu mřížky nad plátno
const addOverlayToCanvas = (canvasElement, overlay) => {
  canvasElement.parentElement.parentElement.appendChild(overlay);
};

// funkce pro přidání elementů pro zobrazení hodnot pixelů do mřížky
const addValuesElementsToOverlay = (overlay) => {
  const cells = overlay.querySelectorAll(".canvas-values-grid-cell");
  cells.forEach((cell) => {
    const valueElement = document.createElement("div");
    valueElement.classList.add("canvas-values-grid-cell-value");
    valueElement.innerHTML = "<span>0</span>";
    cell.appendChild(valueElement);
  });
};

// získání objektu PixelsData s pixely vybraného bloku
const getCroppedPixelsData = (pixelsData, blockRow, blockColumn) => {
  const x1 = blockColumn * SELECT_PIXELS_AREA_SIZE;
  const x2 = (blockColumn + 1) * SELECT_PIXELS_AREA_SIZE - 1;
  const y1 = blockRow * SELECT_PIXELS_AREA_SIZE;
  const y2 = (blockRow + 1) * SELECT_PIXELS_AREA_SIZE - 1;
  const croppedPixels = [];
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const pixel = pixelsData.getPixel(x, y);
      pixel.col = x - x1;
      pixel.row = y - y1;
      croppedPixels.push(pixel);
    }
  }
  return new PixelsData(
    croppedPixels,
    pixelsData.colorMode,
    x2 - x1 + 1,
    y2 - y1 + 1
  );
};

// získání objektu PixelsData s pixely po aplikaci DCT
const getDCTPixelsData = (pixelsData) => {
  pixelsData = pixelsData.convertToColorMode(COLOR_MODES.YCC);
  const yComponentValues = pixelsData.getComponentValues("y");
  const reducedValues = yComponentValues.map((value) => value - 128);
  const dctValues = applyDCT(getGrid(reducedValues, SELECT_PIXELS_AREA_SIZE));
  const decimalValues = toFixedValues(dctValues, 2);
  const absolutedValues = absoluteValues(decimalValues);
  const resultPixelsData = PixelsData.fromValues(
    normalizeValues(absolutedValues),
    COLOR_MODES.YCC,
    pixelsData.width,
    pixelsData.height
  );
  resultPixelsData.originalValues = decimalValues;
  return resultPixelsData;
};

// získání objektu PixelsData s pixely po kvantizaci
const getQuantizationPixelsData = (pixelValues, width, height, quality) => {
  const quantizedValues = applyQuantization(pixelValues, quality);
  const roundedValues = roundValues(quantizedValues);
  const resultPixelsData = PixelsData.fromValues(
    normalizeValues(absoluteValues(roundedValues)),
    COLOR_MODES.YCC,
    width,
    height
  );
  resultPixelsData.originalValues = roundedValues;
  return resultPixelsData;
};

// získání objektu PixelsData s pixely po dekvantizaci
const getDequantizationPixelsData = (pixelValues, width, height, quality) => {
  const dequantizedValues = applyDequantization(pixelValues, quality);
  const resultPixelsData = PixelsData.fromValues(
    normalizeValues(absoluteValues(dequantizedValues)),
    COLOR_MODES.YCC,
    width,
    height
  );
  resultPixelsData.originalValues = dequantizedValues;
  return resultPixelsData;
};

// získání objektu PixelsData s pixely po aplikaci IDCT
const getIDCTPixelsData = (pixelValues, width, height) => {
  const idctValues = applyIDCT(pixelValues);
  const roundedValues = roundValues(idctValues);
  const increasedValues = roundedValues.map((value) => value + 128);
  return PixelsData.fromValues(
    normalizeValues(increasedValues),
    COLOR_MODES.YCC,
    width,
    height
  );
};

// získání objektu PixelsData po postupném aplikování všech procesních kroků (DCT, kvantizace, dekvantizace, IDCT)
const getAllProcessingStepsPixelsData = (pixelsData, quality) => {
  pixelsData = pixelsData.convertToColorMode(COLOR_MODES.YCC);
  const squares = getSquares(
    pixelsData.pixels,
    SELECT_PIXELS_AREA_SIZE,
    pixelsData.width
  );
  let resultPixelsData = new PixelsData(
    [],
    COLOR_MODES.YCC,
    pixelsData.width,
    pixelsData.height
  );
  for (const { squareRow, squareCol, square } of squares) {
    const yComponentValues = square.map((pixel) => pixel.y);
    const reducedValues = yComponentValues.map((value) => value - 128);
    const dctValues = applyDCT(getGrid(reducedValues, SELECT_PIXELS_AREA_SIZE));
    const decimalAfterDCTValues = toFixedValues(dctValues, 2);
    const quantizedValues = applyQuantization(decimalAfterDCTValues, quality);
    const roundedAfterQuantizationValues = roundValues(quantizedValues);
    const dequantizedValues = applyDequantization(
      roundedAfterQuantizationValues,
      quality
    );
    const idctValues = applyIDCT(dequantizedValues);
    const roundedAfterIDCTValues = roundValues(idctValues);
    const increasedValues = roundedAfterIDCTValues.map((value) => value + 128);
    resultPixelsData.addPixelValues(
      increasedValues,
      squareRow,
      squareCol,
      SELECT_PIXELS_AREA_SIZE,
      SELECT_PIXELS_AREA_SIZE
    );
  }
  return resultPixelsData;
};

// vrací seznam skupin buněk s elementy hodnot pixelů podle jejich pozice
const getCellsGroups = (cells) => {
  const cellsGroupsByPosition = {};
  cells.forEach((cell) => {
    const column = cell.getAttribute("data-column");
    const row = cell.getAttribute("data-row");
    const key = `${column}-${row}`;
    if (!cellsGroupsByPosition[key]) {
      cellsGroupsByPosition[key] = [];
    }
    cellsGroupsByPosition[key].push(cell);
  });
  return Object.values(cellsGroupsByPosition);
}
