
// Dependencies
var assert = require('assert')
var sinon = require('sinon')

const quoteServicePath = '../../src/service/quote';

process.on('unhandledRejection', (reason, promise) => {
    console.log(JSON.stringify(promise));
    throw reason;
});

describe('services/quote', () => {
    /*
    Buy logic tests
    */
    it('buy quote calculated from asks', (done) => {
        const expectedBtc = 2;
        const expectedPrice = 1;
        const expectedQuoteCurrency = "USD";

        let quoteService = require('../../src/service/quote')({
            getProductOrderBook: (ids, options) => {
                return new Promise((resolve, reject) => {
                    resolve({ asks: [[expectedPrice, expectedBtc, 1]] });
                });
            }
        });

        quoteService
            .getQuote({
                action: "buy",
                base_currency: "BTC",
                quote_currency: expectedQuoteCurrency,
                amount: expectedBtc
            })
            .then(quote => {
                assert.equal(expectedBtc * expectedPrice, quote.total);
                assert.equal(expectedPrice, quote.price);
                assert.equal(expectedQuoteCurrency, quote.currency);
                done();
            });
    });

    it('buy quote gets cheapest ask first', (done) => {
        const expectedBtc = 2;
        const expectedPrice = 1;
        const expectedQuoteCurrency = "USD";

        let quoteService = require('../../src/service/quote')({
            getProductOrderBook: (ids, options) => {
                return new Promise((resolve, reject) => {
                    resolve({ asks: [
                        [expectedPrice * 2, expectedBtc, 1],
                        [expectedPrice, expectedBtc, 1],
                        [expectedPrice * 5, expectedBtc, 1]
                    ] });
                });
            }
        });

        quoteService
            .getQuote({
                action: "buy",
                base_currency: "BTC",
                quote_currency: expectedQuoteCurrency,
                amount: expectedBtc
            })
            .then(quote => {
                assert.equal(expectedBtc * expectedPrice, quote.total);
                assert.equal(expectedPrice, quote.price);
                assert.equal(expectedQuoteCurrency, quote.currency);
                done();
            });
    });

    it('buy quote gets aggregated asks if first asks not enough', (done) => {
        const expectedBtc = 2;
        const expectedQuoteCurrency = "USD";

        let quoteService = require('../../src/service/quote')({
            getProductOrderBook: (ids, options) => {
                return new Promise((resolve, reject) => {
                    resolve({ asks: [
                        [5, 1, 1],
                        [1, 1, 1],
                        [2, 1, 1]
                    ] });
                });
            }
        });

        quoteService
            .getQuote({
                action: "buy",
                base_currency: "BTC",
                quote_currency: expectedQuoteCurrency,
                amount: expectedBtc
            })
            .then(quote => {
                assert.equal(3, quote.total);
                assert.equal(1.5, quote.price);
                assert.equal(expectedQuoteCurrency, quote.currency);
                done();
            });
    });

    /*
    Sell logic test
    */

    it('sell quote calculated from bids', (done) => {
        const expectedBtc = 2;
        const expectedPrice = 1;
        const expectedQuoteCurrency = "USD";

        let quoteService = require('../../src/service/quote')({
            getProductOrderBook: (ids, options) => {
                return new Promise((resolve, reject) => {
                    resolve({ bids: [[expectedPrice, expectedBtc, 1]] });
                });
            }
        });

        quoteService
            .getQuote({
                action: "sell",
                base_currency: "BTC",
                quote_currency: expectedQuoteCurrency,
                amount: expectedBtc
            })
            .then(quote => {
                assert.equal(expectedBtc * expectedPrice, quote.total);
                assert.equal(expectedPrice, quote.price);
                assert.equal(expectedQuoteCurrency, quote.currency);
                done();
            });
    });

    it('sell quote gets biggest bids first', (done) => {
        const expectedBtc = 2;
        const expectedPrice = 8;
        const expectedQuoteCurrency = "USD";

        let quoteService = require('../../src/service/quote')({
            getProductOrderBook: (ids, options) => {
                return new Promise((resolve, reject) => {
                    resolve({ bids: [
                        [expectedPrice-1, expectedBtc, 1],
                        [expectedPrice, expectedBtc, 1],
                        [expectedPrice/2, expectedBtc, 1]
                    ] });
                });
            }
        });

        quoteService
            .getQuote({
                action: "sell",
                base_currency: "BTC",
                quote_currency: expectedQuoteCurrency,
                amount: expectedBtc
            })
            .then(quote => {
                assert.equal(expectedBtc * expectedPrice, quote.total);
                assert.equal(expectedPrice, quote.price);
                assert.equal(expectedQuoteCurrency, quote.currency);
                done();
            });
    });

    it('sell quote gets calculated from first aggregated bids', (done) => {
        const expectedBtc = 2;
        const expectedQuoteCurrency = "USD";

        let quoteService = require('../../src/service/quote')({
            getProductOrderBook: (ids, options) => {
                return new Promise((resolve, reject) => {
                    resolve({ bids: [
                        [5, 1, 1],
                        [1, 1, 1],
                        [2, 1, 1]
                    ] });
                });
            }
        });

        quoteService
            .getQuote({
                action: "sell",
                base_currency: "BTC",
                quote_currency: expectedQuoteCurrency,
                amount: expectedBtc
            })
            .then(quote => {
                assert.equal(7, quote.total);
                assert.equal(3.5, quote.price);
                assert.equal(expectedQuoteCurrency, quote.currency);
                done();
            });
    });
});