/*
retrieved product ids using the GET /products call from the gdax client and mapping
might store that in a file
*/
let productIds = [
    "BCH-USD",
    "LTC-EUR", "LTC-USD", "LTC-BTC",
    "ETH-EUR", "ETH-USD", "ETH-BTC",
    "BTC-GBP", "BTC-EUR", "BTC-USD"
];

const ORDER_PRICE = 0;
const ORDER_SIZE = 1;
const ORDER_NUM = 2;

function parseOrdersAggregates(orders) {
    return orders.map(o => [parseFloat(o[ORDER_PRICE]), parseFloat(o[ORDER_SIZE]), parseInt(o[ORDER_NUM])])
}

function maximiseValue(maxValue, increment, low, high) {
    if (high < low) {
        var highValue = increment * high;
        return (highValue < maxValue) ? high : 1;
    }

    var mid = parseInt(low + ((high - low) / 2));
    var midValue = increment * mid;

    if (midValue > maxValue) return maximiseValue(maxValue, increment, low, mid - 1);
    else if (midValue < maxValue) return maximiseValue(maxValue, increment, mid + 1, high);

    return mid;
}

function calculateQuoteFromSortedOrders(orders, target) {
    var cursor = 0;

    var totalQuantity = 0;
    var totalPrice = 0;

    let remainer = target - totalQuantity;

    do {
        // skip orders where the size is bigger than what we need
        while (cursor < orders.length && remainer < orders[cursor][ORDER_SIZE]) cursor++;

        if (cursor < orders.length) {
            var maxOrderCount = maximiseValue(remainer, orders[cursor][ORDER_SIZE], 1, orders[cursor][ORDER_NUM]);
            var quantity = orders[cursor][ORDER_SIZE] * maxOrderCount;
            var price = orders[cursor][ORDER_PRICE] * quantity;

            totalPrice += price;
            remainer -= quantity;

            cursor++;
        }
    } while (0 < remainer && cursor < orders.length);

    return totalPrice;
}

function calculateInvertedQuoteFromSortedOrders(orders, target) {
    var cursor = 0;

    var totalQuantity = 0;
    var totalPrice = 0;

    let remainer = target;

    do {
        // skip orders where the size is bigger than what we need
        while (cursor < orders.length && remainer < orders[cursor][ORDER_SIZE] * orders[cursor][ORDER_PRICE]) cursor++;

        if (cursor < orders.length) {
            var amountIncrement = orders[cursor][ORDER_SIZE] * orders[cursor][ORDER_PRICE];
            var maxOrderCount = maximiseValue(remainer, amountIncrement, 1, orders[cursor][ORDER_NUM]);
            var quantity = orders[cursor][ORDER_SIZE] * maxOrderCount;
            var price = orders[cursor][ORDER_PRICE] * quantity;

            totalQuantity += quantity;
            remainer -= price;

            cursor++;
        }
    } while (0 < remainer && cursor < orders.length)

    return totalQuantity;
}

function handleBuyRequest(request, asks) {
    asks = asks.sort((a, b) => a[ORDER_PRICE] - b[ORDER_PRICE]);

    var totalPrice = calculateQuoteFromSortedOrders(asks, request.amount);

    return new Promise((resolve, reject) => {
        resolve({
            total: totalPrice,
            price: (totalPrice / request.amount),
            currency: request.quote_currency
        });
    });
}

function handleInvertedBuyRequest(request, asks) {
    console.log(asks);
    asks = asks.sort((a, b) => a[ORDER_PRICE] - b[ORDER_PRICE]);

    var totalQuantity = calculateInvertedQuoteFromSortedOrders(asks, request.amount);

    return new Promise((resolve, reject) => {
        resolve({
            total: totalQuantity,
            price: (totalQuantity / request.amount),
            currency: request.quote_currency
        });
    });
}

function handleSellRequest(request, bids) {
    bids = bids.sort((a, b) => b[ORDER_PRICE] - a[ORDER_PRICE]);

    var totalPrice = calculateQuoteFromSortedOrders(bids, request.amount);

    return new Promise((resolve, reject) => {
        resolve({
            total: totalPrice,
            price: totalPrice / request.amount,
            currency: request.quote_currency
        });
    });
}

function handleInvertedSellRequest(request, asks) {
    bids = bids.sort((a, b) => b[ORDER_PRICE] - a[ORDER_PRICE]);

    var totalQuantity = calculateInvertedQuoteFromSortedOrders(bids, request.amount);

    return new Promise((resolve, reject) => {
        resolve({
            total: totalQuantity,
            price: (totalQuantity / request.amount),
            currency: request.quote_currency
        });
    });
}

function getQuoteRequest(request) {
    let baseCurrency;
    let quoteCurrency;

    let productId = request.base_currency + "-" + request.quote_currency;
    let invertedProductId = request.quote_currency + "-" + request.base_currency;

    if (productIds.includes(productId)) {
        return {
            productId: productId,
            baseCurrency: request.base_currency,
            quoteCurrency: request.quote_currency,
            amount: request.amount,
            quoteIsInverted: false,
            action: request.action
        }
    }
    else if (productIds.includes(invertedProductId)) {
        return {
            productId: invertedProductId,
            baseCurrency: request.quote_currency,
            quoteCurrency: request.base_currency,
            amount: request.amount,
            quoteIsInverted: true,
            action: request.action
        }
    }

    return false;
}

module.exports = (gdaxPublicClient) => {
    return {
        getQuote: (request) => {
            let quoteRequest = getQuoteRequest(request);

            return new Promise((resolve, reject) => {
                if (!quoteRequest) {
                    reject({ code: 400, message: "Invalid input." })
                    return;
                }

                gdaxPublicClient.getProductOrderBook(quoteRequest.productId, { level: 2 })
                    .then((response) => {
                        if (quoteRequest.action === "buy") {
                            (quoteRequest.quoteIsInverted ?
                                handleInvertedBuyRequest(request, parseOrdersAggregates(response.asks)) :
                                handleBuyRequest(request, parseOrdersAggregates(response.asks)))
                                .then(resolve)
                                .catch(() => reject({ message: "Cannot get a quote to buy " + quoteRequest.baseCurrency }));
                        }
                        else if (quoteRequest.action === "sell") {
                            (quoteRequest.quoteIsInverted ?
                                handleInvertedSellRequest(request, parseOrdersAggregates(response.bids)) :
                                handleSellRequest(request, parseOrdersAggregates(response.bids)))
                                .then(resolve)
                                .catch(() => reject({ message: "Cannot get a quote to sell " + quoteRequest.baseCurrency }));
                        }
                        else reject({ message: "Invalid action: " + quoteRequest.action });
                    })
                    .catch((err) => {
                        console.log(JSON.stringify(err));
                        reject({ message: "could not retrieve order book for " + quoteRequest.productId });
                    });
            });
        }
    }
}