// rozmer jednoho bloku který uživatel vybere
const SELECT_PIXELS_AREA_SIZE = 8;

// hodnoty omezující kvalitu komprese
const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
// výchozí hodnota kvality komprese
const DEFAULT_QUALITY = 50;

const DEFAULT_ROUNDING_MODE_VALUE = "classic";

// třída kontrolující DCT aplet
class VisualizationAppletController {
	constructor() {
		this.qualityValue = DEFAULT_QUALITY;
		this.roundingModeValue = DEFAULT_ROUNDING_MODE_VALUE;
		this.selectedPixelsArea = {
			column: 0,
			row: 0,
		};
		this.originalPixelsData = null;
		this.originalRecalculatedPixelsData = null;
		this.recalculatedIDCTValues = [];
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
		this.initRoundingModeSelector();
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
			this.updateOriginalCroppedCanvas();
			this.updateIDCTCanvas();
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
		const recalculatedData = getRecalculatedPixelsData(
			this.originalPixelsData.clone(),
			this.roundingModeValue
		);
		this.originalRecalculatedPixelsData = recalculatedData.pixelData;
		this.recalculatedIDCTValues = recalculatedData.idctValues;
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
		this.updateOriginalCroppedCanvas();
		this.updateIDCTCanvas();
		this.updateResultCanvas();
	}

	// aktualizace plátna s výchozím obrázkem
	updateOriginalCanvas() {
		const pixelsDataToSet = this.roundingModeValue === "classic" ? this.originalPixelsData : this.originalRecalculatedPixelsData
		this.originalCanvas.setPixelsData(pixelsDataToSet);
		this.originalCanvas.update();
	}

	// aktualizace plátna s vybraným blokem
	updateOriginalCroppedCanvas() {
		const pixelsDataToCrop = this.roundingModeValue === "classic" ? this.originalPixelsData : this.originalRecalculatedPixelsData
		const croppedPixelsData = getCroppedPixelsData(
			pixelsDataToCrop.clone(),
			this.selectedPixelsArea.row,
			this.selectedPixelsArea.column
		);
		this.originalCroppedCanvas.setPixelsData(croppedPixelsData);
		this.originalCroppedCanvas.update();
		this.setCanvasPixelsValues(this.originalCroppedCanvas);
	}

	// aktualizace plátna s pixely po IDCT transformací
	updateIDCTCanvas() {
		let idctPixelsData;
		if (this.roundingModeValue === "classic") {
			idctPixelsData = getIDCTPixelsData(
				this.originalCroppedCanvas.pixelsData.clone(),
				this.qualityValue,
				this.roundingModeValue,
			);
		} else {
			idctPixelsData = getIDCTRecalculatedPixelsData(
				this.recalculatedIDCTValues[this.selectedPixelsArea.row][this.selectedPixelsArea.column],
				this.qualityValue
			);
		}
		this.idctCanvas.setPixelsData(idctPixelsData);
		this.idctCanvas.update();
		this.setCanvasPixelsValues(this.idctCanvas);
	}

	// aktualizace plátna s výsledným obrázkem
	updateResultCanvas() {
		let resultPixelsData;
		if (this.roundingModeValue === "classic") {
			resultPixelsData = getAllProcessingStepsPixelsData(
				this.originalPixelsData.clone(),
				this.qualityValue,
			);
		} else {
			resultPixelsData = getResultRecalculatedPixelsData(
				this.recalculatedIDCTValues,
				this.qualityValue,
				this.resultCanvas.width,
				this.resultCanvas.height
			);
		}
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
			this.updateIDCTCanvas();
			this.updateResultCanvas();
		});
		qualitySlider.addEventListener("change", (e) => {
			const value = e.target.value;
			qualityInput.value = value;
			this.setQuality(value);
			this.updateIDCTCanvas();
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
				this.updateOriginalCroppedCanvas();
				this.updateIDCTCanvas();
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

	// inicializace ovládání výběru zaokrouhlovacího módu
	initRoundingModeSelector() {
		const roundingModeRadioButtons = document.querySelectorAll(
			'input[name="roundingMode-select"]'
		);
		roundingModeRadioButtons.forEach(btn => {
			btn.addEventListener("change", (e) => {
				this.setRoundingMode(e.target.value);
				const recalculatedData = getRecalculatedPixelsData(
					this.originalPixelsData.clone(),
					this.roundingModeValue
				);
				this.originalRecalculatedPixelsData = recalculatedData.pixelData;
				this.recalculatedIDCTValues = recalculatedData.idctValues;
				this.updateOriginalCanvas();
				this.updateOriginalCroppedCanvas();
				this.updateIDCTCanvas();
				this.updateResultCanvas();
			});
		});
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
		addOverlayToCanvas(this.originalCroppedCanvas.targetElement, overlay.cloneNode(true));
		addOverlayToCanvas(this.idctCanvas.targetElement, overlay.cloneNode(true));
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
			// if value is without decimal part, don't show decimal part
			const preparedValueToDisplay = valueToDisplay % 1 === 0
				? valueToDisplay
				: valueToDisplay.toFixed(1);
			cell.textContent = preparedValueToDisplay.toString();
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
		this.qualityValue = quality;
	}

	// setter pro hodnotu zaokrouhlovacího módu
	setRoundingMode(roundingMode) {
		this.roundingModeValue = roundingMode;
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

// // funkce pro přidání elementů pro zobrazení hodnot pixelů do mřížky
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
	const resultPixelsData = new PixelsData(
		croppedPixels,
		pixelsData.colorMode,
		x2 - x1 + 1,
		y2 - y1 + 1
	);
	resultPixelsData.originalValues = resultPixelsData.getComponentValues("r");
	return resultPixelsData;
};

// získání objektu PixelsData s pixely po aplikaci IDCT
const getIDCTPixelsData = (pixelsData, quality) => {
	pixelsData = pixelsData.convertToColorMode(COLOR_MODES.YCC);
	const yComponentValues = pixelsData.getComponentValues("y");
	const reducedValues = yComponentValues.map((value) => value - 128);
	const dctValues = applyDCT(getGrid(reducedValues, SELECT_PIXELS_AREA_SIZE));
	const quantizedValues = applyQuantization(dctValues, quality);
	const roundedAfterQuantizationValues = roundValues(quantizedValues);
	const dequantizedValues = applyDequantization(
		roundedAfterQuantizationValues,
		quality
	);
	const idctValues = applyIDCT(dequantizedValues);
	const roundedAfterIDCTValues = roundValues(idctValues);
	const increasedValues = roundedAfterIDCTValues.map((value) => value + 128);
	const resultPixelsData = PixelsData.fromValues(
		normalizeValues(increasedValues),
		COLOR_MODES.YCC,
		pixelsData.width,
		pixelsData.height,
		["y"]
	);
	resultPixelsData.changeColorMode(COLOR_MODES.RGB);
	resultPixelsData.originalValues = resultPixelsData.getComponentValues("r");
	return resultPixelsData;
};

// získání objektu PixelsData s pixely po aplikaci IDCT na základě přepočítaných hodnot
const getIDCTRecalculatedPixelsData = (initialValues, quality) => {
	const dctValues = applyDCT(getGrid(initialValues, SELECT_PIXELS_AREA_SIZE));
	const quantizedValues = applyQuantization(dctValues, quality);
	const roundedAfterQuantizationValues = roundValues(quantizedValues);
	const dequantizedValues = applyDequantization(
		roundedAfterQuantizationValues,
		quality
	);
	const idctValues = applyIDCT(dequantizedValues);
	const roundedAfterIDCTValues = roundValues(idctValues);
	const increasedValues = roundedAfterIDCTValues.map((value) => value + 128);
	const resultPixelsData = PixelsData.fromValues(
		normalizeValues(increasedValues),
		COLOR_MODES.YCC,
		SELECT_PIXELS_AREA_SIZE,
		SELECT_PIXELS_AREA_SIZE,
		["y"]
	);
	resultPixelsData.changeColorMode(COLOR_MODES.RGB);
	resultPixelsData.originalValues = resultPixelsData.getComponentValues("r");
	return resultPixelsData;
};

// získání objektu PixelsData s přepočítanými pixely původního obrázku
const getRecalculatedPixelsData = (pixelsData, roundingMode) => {
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
	const squaresRowsNumber = Math.ceil(pixelsData.height / SELECT_PIXELS_AREA_SIZE);
	const squaresColumnsNumber = Math.ceil(pixelsData.width / SELECT_PIXELS_AREA_SIZE);
	const idctValues = create2dArray(squaresRowsNumber, squaresColumnsNumber);
	for (const {squareRow, squareCol, square} of squares) {
		const yComponentValues = square.map((pixel) => pixel.y);
		const reducedValues = yComponentValues.map((value) => value - 128);
		const dctValues = applyDCT(getGrid(reducedValues, SELECT_PIXELS_AREA_SIZE));
		const roundedAfterQuantizationValues = applySpecificRoundingMode(
			dctValues,
			roundingMode
		);
		const squareIdctValues = applyIDCT(roundedAfterQuantizationValues);
		idctValues[squareRow][squareCol] = squareIdctValues
		const increasedValues = squareIdctValues.map((value) => value + 128);
		const roundedAfterIDCTValues = roundValues(increasedValues);
		resultPixelsData.addPixelValues(
			normalizeValues(roundedAfterIDCTValues),
			squareRow,
			squareCol,
			SELECT_PIXELS_AREA_SIZE,
			SELECT_PIXELS_AREA_SIZE,
			["y"]
		);
	}
	resultPixelsData.changeColorMode(COLOR_MODES.RGB);
	return {pixelData:resultPixelsData, idctValues: idctValues};
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
		const quantizedValues = applyQuantization(dctValues, quality);
		const roundedAfterQuantizationValues = roundValues(quantizedValues);
		const dequantizedValues = applyDequantization(
			roundedAfterQuantizationValues,
			quality
		);
		const idctValues = applyIDCT(dequantizedValues);
		const increasedValues = idctValues.map((value) => value + 128);
		const roundedAfterIDCTValues = roundValues(increasedValues);
		resultPixelsData.addPixelValues(
			normalizeValues(roundedAfterIDCTValues),
			squareRow,
			squareCol,
			SELECT_PIXELS_AREA_SIZE,
			SELECT_PIXELS_AREA_SIZE,
			["y"]
		);
	}
	resultPixelsData.changeColorMode(COLOR_MODES.RGB);
	return resultPixelsData;
};

// získání objektu PixelsData po postupném aplikování všech procesních kroků (DCT, kvantizace, dekvantizace, IDCT) na základě přepočítaných hodnot
const getResultRecalculatedPixelsData = (initialValues, quality, width, height) => {
	let resultPixelsData = new PixelsData(
		[],
		COLOR_MODES.YCC,
		width,
		height
	);
	for (let squareRow = 0; squareRow < initialValues.length; squareRow++) {
		for (let squareCol = 0; squareCol < initialValues[0].length; squareCol++) {
			const reducedValues = initialValues[squareRow][squareCol];
			const dctValues = applyDCT(getGrid(reducedValues, SELECT_PIXELS_AREA_SIZE));
			const quantizedValues = applyQuantization(dctValues, quality);
			let roundedAfterQuantizationValues = roundValues(quantizedValues);
			const dequantizedValues = applyDequantization(
				roundedAfterQuantizationValues,
				quality
			);
			const idctValues = applyIDCT(dequantizedValues);
			const increasedValues = idctValues.map((value) => value + 128);
			const roundedAfterIDCTValues = roundValues(increasedValues);
			resultPixelsData.addPixelValues(
				normalizeValues(roundedAfterIDCTValues),
				squareRow,
				squareCol,
				SELECT_PIXELS_AREA_SIZE,
				SELECT_PIXELS_AREA_SIZE,
				["y"]
			);
		}
	}
	resultPixelsData.changeColorMode(COLOR_MODES.RGB);
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
