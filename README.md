# Pixel validator script

This is a Node.js command line script that ingests a CSV file and validates all impression pixels within by performing a HTTP GET request for each pixel's URL, and recording the status response.

It then prints out a summary of the results to the console:

* Number of valid pixels with OK responses (2XX and 3XX status codes)
* Number of invalid pixels with failed responses (4XX and 5XX status codes, errors thrown for no server response)
* Number of errors thrown while validating a pixel
* List of pixels that failed (tactic ID, pixel URL)
* List of pixels with errors thrown (tactic ID, pixel URL, error message)

The script code can be found in the root directory of the repository, in `validator.js`.

## Dependencies

* Latest version of Node.js installed
* `csvtojson` NPM package (included in package.json)
* `mocha` and `chai` for running tests

## How To Run

* Clone repository using `git clone https://github.com/p-cherukuri/pixel-validator` or download ZIP
* Navigate to root directory using `cd pixel-validator`
* Use `npm install -g` to install dependencies and binary script
* Run the script from root directory using `validate` (make sure you have your target CSV file in the root directory, and ensure it is using comma (`,`) as a separator)
* Summary of results will be printed in the console, and full summary will be printed to a new file `summary.csv` in the root directory

## Issues

* Script takes a long time to complete, possibly due to double for loop for GET requests
* Breaking issue - script hangs when reaching ~14200 items in the error array, and doesn't proceed
