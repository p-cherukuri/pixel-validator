#!/usr/bin/env node

/*
  Script that ingests a CSV file and validates all impression pixel URLs within
*/

/*
  CSV to JSON conversion done using the 'csvtojson' NPM package with the ',' delimiter
*/

const csvFilePath = "./tactic.csv";
const csv = require("csvtojson");
const jsonArr = [];

console.log("Converting from CSV to JSON...");
// Converting CSV to array of JSON objects
csv({ delimiter: "," })
  .fromFile(csvFilePath)
  .on("json", jsonObj => {
    jsonArr.push(jsonObj);
  })

  .on("done", error => {
    console.log("Conversion finished. Cleaning JSON data...");

    let myPromise = new Promise((resolve, reject) => {
      jsonArr.forEach((itm, i) => {
        if (
          itm.impression_pixel_json == "[]" ||
          itm.impression_pixel_json == "NULL"
        ) {
          return;
        } else {
          let cleaningURL = itm.impression_pixel_json.substring(
            1,
            itm.impression_pixel_json.length - 1
          );
          cleaningURL = cleaningURL.replace(/\\\//g, "/");
          let cleanedURLArray = cleaningURL.replace(/"/g, "").split(",");
          itm.impression_pixel_json = cleanedURLArray;
          // console.log(itm);
        }
      });
      //console.log(jsonArr);
      resolve(jsonArr);
    });

    myPromise.then(cleanData => {
      console.log("Cleaning finished.");
      console.log(cleanData);
    });
  });
