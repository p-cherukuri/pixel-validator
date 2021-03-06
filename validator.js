#!/usr/bin/env node

/*
  Script that ingests a CSV file and validates all impression pixel URLs within and prints a summary
  of results (# of OK/Failed status codes, and a list of the failed pixels)
*/

/*
  CSV to JSON conversion done using the 'csvtojson' NPM package with the ',' delimiter
*/

const csvFilePath = "./tactic.csv";
const csvOutputPath = "summary.csv";
const csv = require("csvtojson");
const jsontoCSV = require("json-to-csv");
const http = require("http");
const https = require("https");
const jsonArr = [];
let client = http;
/** Conversion from CSV to JSON */
console.log("Converting from CSV to JSON...");
// Converting CSV to array of JSON objects
csv({ delimiter: "," })
  .fromFile(csvFilePath)
  .on("json", jsonObj => {
    jsonArr.push(jsonObj);
  })
  /** Pixel URL Cleaning */
  .on("done", error => {
    console.log("Conversion finished. Cleaning JSON data...");

    // Promise that cleans the 'impression_pixel_json' attribute of each object in the array
    let myPromise = new Promise((resolve, reject) => {
      jsonArr.forEach((itm, i) => {
        // Skip object if there is no pixel URL
        if (
          itm.impression_pixel_json == "[]" ||
          itm.impression_pixel_json == "NULL"
        ) {
          return;
        } else {
          /* Clean pixel URLs by removing the brackets surrounding it,
             removing all the backslashes and quotations,
             and then splitting into an array of pixel URLS (some tactics have multiple pixels to fire)
          */
          let cleaningURL = itm.impression_pixel_json.substring(
            1,
            itm.impression_pixel_json.length - 1
          );
          cleaningURL = cleaningURL.replace(/\\\//g, "/");
          let cleanedURLArray = cleaningURL.replace(/"/g, "").split(",");
          itm.impression_pixel_json = cleanedURLArray;
        }
      });
      resolve(jsonArr);
    });

    /** Pixel Validation with HTTP GET */
    myPromise.then(cleanData => {
      console.log("Cleaning finished. Validating pixels...");

      let okStatusCount = 0; // # of valid pixels
      let failedStatusCount = 0; // # of invalid pixels
      let errorCount = 0; // # of errors thrown while validating a pixel
      let failedPixelArray = []; // list of invalid pixels with their tactic ID and URL
      let errorArray = []; // list of error throwing pixels with their tactic ID, URL, and error message

      // TODO - double for loop for the GET requests takes a long time to complete...any better way to do this?
      cleanData.forEach((itm, i) => {
        // Skip again if there is no pixel URL
        if (
          itm.impression_pixel_json == "[]" ||
          itm.impression_pixel_json == "NULL"
        ) {
          return;
        } else {
          // Hold current tactic ID in this variable for recording any potential failed pixels
          let currentTacticID = itm.tactic_id;

          itm.impression_pixel_json.forEach((url, i) => {
            // First check if the pixel URL is HTTPS or HTTP, and use appropriate protocol
            if (url.indexOf("https") === 0) {
              client = https;
            } else {
              client = http;
            }
            let req = client.get(url, resp => {
              //console.log("Response:" + resp.statusCode);

              // If a response is received, and is an OK status code (2XX or 3XX), increment the # of valid pixels
              if (
                resp.statusCode.toString().startsWith("2") ||
                resp.statusCode.toString().startsWith("3")
              ) {
                okStatusCount++;
              } else {
                // If a response is received, and is a failed status code (4XX or 5XX), increment # of failed pixels,
                // and push a new object into the failed pixels list containing the current tactic ID, pixel URL, and status code
                failedStatusCount++;
                failedPixelArray.push({
                  failed_tactic_id: currentTacticID,
                  failed_pixel_url: url
                });
                console.log(failedPixelArray); // logging this temporarily for debugging
              }
            });

            // If there is an error thrown during the request, increment the failed pixel count,
            // and push a new object into the failed pixels list containing the current tactic ID, pixel URL, and error message
            req.on("error", error => {
              //console.log(error);
              errorCount++;
              errorArray.push({
                error_tactic_id: currentTacticID,
                error_pixel_url: url,
                error_msg: error
              });
              console.log(errorArray);
            });

            /** Printing out Summary */
            req.end(data => {
              // Print out the summary of results
              console.log(
                "Validation finished. Here's a brief summary of the results:"
              );
              console.log(
                "# of Valid Pixels (OK Status code): " +
                  okStatusCount +
                  "\n# of Invalid Pixels (Failed status code or Error thrown during request): " +
                  failedStatusCount +
                  "\n# of Errors Thrown During Pixel Validation: " +
                  errorCount
              );

              // Print out full summary of results to root path in new CSV file, 'summary.csv'
              console.log("Printing out full summary in new CSV file...");
              let csvArray = [];

              csvArray.push(
                { valid_pixel_count: okStatusCount },
                { failed_pixel_count: failedStatusCount }
              );
              csvArray.push.apply(csvArray, failedPixelArray);
              csvArray.push.apply(csvArray, errorArray);

              jsonToCSV(o, csvOutputPath)
                .then(() => {
                  console.log(
                    "CSV summary complete. It can be found in 'summary.csv'"
                  );
                })
                .catch(error => {
                  // handle error
                  console.log("Error: CSV conversion could not be completed.");
                });
            });
          });
        }
      });
    });
  });
