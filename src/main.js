var express = require('express');
var bodyParser = require('body-parser');

const Gdax = require('gdax');
const publicClient = new Gdax.PublicClient();

var quoteService = require('./service/quote.js')(publicClient);

var app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    publicClient.getProductOrderBook("ETH-EUR", { level: 3 })
        .then((quote) => {
            res.json(quote);
        })
        .catch((error) => {
            var statusCode = !!error.code ? error.code : 500;
            res.status(statusCode).json({ message: error.message })
        });
});

app.post('/quote', (req, res) => {
    quoteService.getQuote(req.body)
        .then((quote) => {
            res.json(quote);
        })
        .catch((error) => {
            var statusCode = !!error.code ? error.code : 500;
            res.status(statusCode).json({ message: error.message })
        });
});

var port = process.env.PORT || 8888;

var server = app.listen(port, () => {
    var host = server.address().address;
    var port = server.address().port;

    console.log("GDAX Quote API listening at http://%s:%s", host, port);
});