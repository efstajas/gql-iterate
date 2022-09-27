# 📃 GQL-Iterate

A simple CL utility for running a query repeatedly with different variable values supplied from a CSV. Ever had to mass-query some object off GQL, but the server only supports fetching what you need one-by-one? That's what this is for!

## ⤵ Install

gql-iterate is available from the NPM and GitHub Packages repositories.

```
npm install @efstajas/gql-iterate -g

or

yarn add @efstajas/gql-iterate -g
```

## 🤓 Usage

Create a `.gql` file containing your query, which can be named anything (make sure there's only a single query specified in the file). Define the variables that you want gql-iterate to read from a CSV with the usual syntax. For example:

```gql
query GetUser($userId: String) {
  user(userId: $userId) {
    firstName
    lastName
    favoriteColor
  }
}
```

Next, create your input CSV file. Your file MUST be a valid CSV (with comma delimiter!) and a header that matches the variable names (without $ prefix) from your query. For example:

```
userId
1234
1235
1236
1237
```

If you have more than one variable in your query, you must supply those additional variables in the CSV as well.

Now, it's time to run the queries! From the directory that contains your query and input CSV, run:

```
gql-iterate --host https://yourserver.com/graphql --input ./input.csv --query ./query.gql
```

GQL-Iterate will now run all of your queries (this might take a while depending on the length of your CSV and speed of your server) and print the output to console, as one stringified JSON object per line.

## 🗝 Authentication

GQL-iterate currently only supports `Authorization: Bearer` Header-based auth. To supply a bearer token, simply run the CLI with the `--bearer < your token >` option.

## Concurrency

If you want to control how many rows are processed in parallel (i.e. you have some rate limit on you API) you can use param `--concurrency`. By default it is set to 0 which means that all of the rows are processed in parallel. If you want it to work sequentially set `concurrency` to 1.
