#!/usr/bin/env node
const { GraphQLClient, gql } = require("graphql-request");
const readline = require("readline");
const yargs = require("yargs");
const { promisify } = require("util");
const fs = require("fs");
const Bottleneck = require("bottleneck/es5");
const { ensureAllVariablesSet } = require("./helpers/ensureAllVariablesSet.js");
const { buildVariables } = require("./helpers/buildVariables.js");

const options = yargs
  .usage("Usage: -host <host URL> -input <input.csv> -query <query.gql>")
  .option("host", {
    alias: "host",
    describe: "Your GraphQL server.",
    type: "string",
    demandOption: true,
  })
  .option("input", {
    alias: "input",
    describe:
      "Path to a CSV file with headers named after what variables should be set to in the query for each column.",
    type: "string",
    demandOption: true,
  })
  .option("query", {
    alias: "query",
    describe:
      "Path to the GraphQL query with variables that will be substituted for values from the CSV.",
    type: "string",
    demandOption: true,
  })
  .option("bearer", {
    alias: "bearer",
    describe: "Optional Bearer token to be set as Authorization header.",
    type: "string",
    demandOption: false,
  })
  .option("concurrency", {
    alias: "concurrency",
    describe: "Amount of requests made concurrently",
    type: "number",
    demandOption: false,
    default: 0,
  }).argv;

const readInterface = readline.createInterface({
  input: fs.createReadStream(options.input),
  terminal: false,
  console: false,
});

const lines = [];

readInterface
  .on("line", (line) => {
    lines.push(line.split(",").map((cellValue) => cellValue.trim()));
  })
  .on("close", () => {
    const [headers, ...rows] = lines;

    main(rows, headers);
  });

async function main(rows, headers) {
  const graphqlQuery = await promisify(fs.readFile)(options.query, {
    encoding: "utf8",
  });

  const queryVariables = graphqlQuery.match(/(?<=\$)(.*?)(?=\:)/g);

  ensureAllVariablesSet(queryVariables, headers);

  const graphQLClient = new GraphQLClient(options.host, {
    headers: options.bearer
      ? {
          authorization: `Bearer ${options.bearer}`,
        }
      : {},
  });
  if (options.concurrency) {
    const limiter = new Bottleneck({ maxConcurrent: options.concurrency });

    for (const row of rows) {
      try {
        const result = await limiter.schedule(() =>
          graphQLClient.request(graphqlQuery, buildVariables(row, headers))
        );
        console.log(JSON.stringify(result), new Date());
      } catch (e) {
        console.log("Something went wrong while running your queries.");
        console.error(e);
      }
    }
  } else {
    const promises = rows.map((row) =>
      graphQLClient.request(graphqlQuery, buildVariables(row, headers))
    );
    try {
      const results = await Promise.all(promises);
      results.forEach((result) => {
        console.log(JSON.stringify(result), new Date());
      });
    } catch (e) {
      console.log("Something went wrong while running your queries.");
      console.error(e);
    }
  }
}
