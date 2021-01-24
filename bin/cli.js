#!/usr/bin/env node

const { GraphQLClient, gql } = require('graphql-request')
const readline = require('readline')
const yargs = require('yargs')
const { promisify } = require('util')
const fs = require('fs')

const options = yargs
    .usage("Usage: -host < host URL > -input < input.csv > -query < query.gql >")
    .option("host", { alias: "host", describe: "Your GraphQL server.", type: "string", demandOption: true })
    .option("input", { alias: "input", describe: "Path to a CSV file with headers named after what variables should be set to in the query for each column.", type: "string", demandOption: true })
    .option("query", { alias: "query", describe: "Path to the GraphQL query with variables that will be substituted for values from the CSV.", type: "string", demandOption: true })
    .option("bearer", { alias: "bearer", describe: "Optional Bearer token to be set as Authorization header.", type: "string", demandOption: false })
    .argv;

const readInterface = readline.createInterface({
    input: fs.createReadStream(options.input),
    terminal: false,
    console: false
});

const lines = []
const suppliedVars = []

readInterface.on('line', (line) => {
    lines.push(line.split(',').map((v) => v.trim()))
}).on('close', () => {
    lines[0].forEach((varName) => {
        suppliedVars.push(varName)
    })
    lines.shift()
    main()
})

const graphQLClient = new GraphQLClient(options.host, {
    headers: options.bearer ? {
        authorization: `Bearer ${options.bearer}`,
    } : {},
})

let query
let varsInQuery
const promises = []

const main = async () => {
    promisify(fs.readFile)(options.query, { encoding: 'utf8' }).then((fileContents) => {
        query = fileContents;
        varsInQuery = query.match(/(?<=\$)(.*?)(?=\:)/g)
        ensureAllVariablesSet()
    }).then(async () => {
        lines.forEach((line) => {
            promises.push(graphQLClient.request(query, buildVariables(line)))
        })
    }).then(async () => {
        try {
            const result = await Promise.all(promises)

            result.forEach((res) => {
                console.log(JSON.stringify(res))
            })
        } catch (e) {
            console.log('Something went wrong while running your queries.')
            console.error(e)
        }
    })
}

const buildVariables = (line) => {
    let object = {}

    suppliedVars.forEach((varName, index) => {
        object[varName] = line[index]
    })

    return object
}

const ensureAllVariablesSet = () => {
    if (!varsInQuery.every(v => suppliedVars.includes(v))) {
        console.log('Please ensure that the supplied csv file contains values for all variables mentioned in your GQL query. You need to include a CSV header with the right variable names.')
        console.log('Variables in GQL query:', varsInQuery, 'Variables supplied in CSV:', suppliedVars)
        process.exit(1)
    }
}
