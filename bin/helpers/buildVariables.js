function buildVariables(line, headers) {
  let object = {};

  headers.forEach((varName, index) => {
    object[varName] = line[index];
  });

  return object;
}

module.exports = { buildVariables };
