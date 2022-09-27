function ensureAllVariablesSet(queryVariables, headers) {
  if (!queryVariables.every((v) => headers.includes(v))) {
    console.log(
      "Please ensure that the supplied csv file contains values for all variables mentioned in your GQL query. You need to include a CSV header with the right variable names."
    );
    console.log(
      "Variables in GQL query:",
      queryVariables,
      "Variables supplied in CSV:",
      headers
    );
    process.exit(1);
  }
}

module.exports = { ensureAllVariablesSet };
