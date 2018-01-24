# GDAX API PLAYTHROUGH

## Description
This API contains one endpoint /quote allowing to get a quote for any currency pair supported by the GDAX API.

## Trade-offs
- Getting the currency pairs as an hardcoded string array in the `quote.js` file directly to prevent having them pulled from the API at every request. Seemed appropriate as the documentation states that if a pair/id exists it will not be removed. They could also be loaded from a configuration file but hardcoding allows to keep this
implementation simpler.

## Improvements to add
- More descriptive error messages in terms of what input to correct, etc.
- Return an error message in case there is no order small/big enough to satisfy the quote.
- Add unit tests for cases where the best priced orders have a quantity too big for the quote.
- Add unit tests for reversed quotes handling (i.e. BTC-ETH)

## UNIX setup
- You will need Node.js and NPM setup on your system.
- Once you have these setup you can load the project dependencies by running `npm install` in this directory.
- Once the dependencies installed, you can use`npm start` to run the API. This will start the Express server on the port 8888. However if a PORT environment variable is setup it is going to be used as port to serve the API.
- You can also run unit tests using `npm test`.