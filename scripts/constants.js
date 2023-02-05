// barevné modely používané v aplikaci
const COLOR_MODES = {
  RGB: "RGB",
  YCC: "YCbCr",
};
// pomocné pole pro mapování barevných modelů na jejich složky
COLOR_MODE_COMPONENTS_BY_COLOR_MODE_KEY = {
  RGB: ["r", "g", "b"],
  YCC: ["y", "cb", "cr"],
};
// pole barevných modelů a jejich složek
COLOR_MODE_COMPONENTS = Object.entries(COLOR_MODES).reduce(
  (acc, [key, value]) => {
    acc[value] = COLOR_MODE_COMPONENTS_BY_COLOR_MODE_KEY[key];
    return acc;
  },
  {}
);

// nastavení rozměrů plátna dle zvolené velikosti
const SMALL_CANVAS_SIZE = 240;
const MEDIUM_CANVAS_SIZE = 320;

// kvantizační matice pro JPEG kompresi
const QUANTIZATION_MATRIX = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16,
  24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109,
  103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];
// cesta k adresáři s obrázky
const ASSETS_DIR = "../assets/";
// jména výchozích obrázků
const DEFAULT_SOURCE_FILE_NAME = "1";
const DEFAULT_BW_SOURCE_FILE_NAME = "bw_1";
