#!/usr/bin/env node

/*
  Script that ingests a CSV file and validates all impression pixel URLs within
*/

/*
  CSV to JSON conversion done using the 'csvtojson' NPM package with the ';' delimiter
*/

const csvFilePath = "./tactic.csv";
const csv = require("csvtojson");
const jsonArr = [];

// Converting CSV to array of JSON objects
csv({ delimiter: ";" })
  .fromFile(csvFilePath)
  .on("json", jsonObj => {
    jsonArr.push(jsonObj);
  })

  .on("done", error => {
    console.log(jsonArr);
  });
