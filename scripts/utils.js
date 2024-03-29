// vrací objekt obsahující pouze zadané seznamem atributy
const pick = (obj, props) => {
  if (!obj || !props) return;
  let picked = {};
  props.forEach(function (prop) {
    picked[prop] = obj[prop];
  });
  return picked;
}

// vrací kopii objektu
const cloneObject = (obj) => {
  return Object.create(obj);
}

// vrací 2D pole HxW, kde H - počet řádků, W - počet sloupců
const create2dArray = (rows, columns) => {
  const arr = new Array(rows);
  for (let i = 0; i < rows; i++) {
    arr[i] = new Array(columns);
  }
  return arr;
}

// vrací seznam bloků velikosti SxS, kde S - zvolená velikost bloku
const getSquares = (array, squareSize, imageWidth) => {
  const rows = getGrid(array, imageWidth);
  const squares = [];
  for (let row = 0; row < rows.length; row += squareSize) {
    for (let col = 0; col < rows[0].length; col += squareSize) {
      const square = [];
      for (let i = row; i < row + squareSize; i++) {
        for (let j = col; j < col + squareSize; j++) {
          square.push(rows[i][j]);
        }
      }
      squares.push({
        square,
        squareRow: row / squareSize,
        squareCol: col / squareSize,
      });
    }
  }
  return squares;
}

// vrací seznam bloků velikosti Lx1, kde L - zvolená délka bloku
const getGrid = (arr, width) => {
  return arr.reduce(
    (result, value, index) => {
      if (index && index % width === 0) result.push([]);
      result[result.length - 1].push(value);
      return result;
    },
    [[]]
  );
};

// generuje cestu k obrázku
const generateImagePath = (fileName) => {
  return `${ASSETS_DIR}${fileName}.png`;
};

// zaokrouhlí hodnoty v seznamu na celá čísla
const roundValues = (arr) => {
  return arr.map((x) => Math.round(x));
};

// zaokrouhlí hodnoty v seznamu na zadaný počet desetinných míst
const toFixedValues = (arr, precision) => {
  return arr.map((x) => x.toFixed(precision));
};

// vrací absolutní hodnoty v seznamu
const absoluteValues = (arr) => {
  return arr.map((x) => Math.abs(x));
};

// normalizuje hodnoty v seznamu do rozsahu 0-255
const normalizeValues = (arr) => {
  return arr.map((x) => normalizeValue(x));
};

// normalizuje hodnotu do rozsahu 0-255
const normalizeValue = (value) => {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value;
}
