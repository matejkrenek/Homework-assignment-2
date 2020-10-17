// Dependencies
var url = require('url');
var http = require('http');
var https = require('https')
var stringDecoder = require('string_decoder').StringDecoder;
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');
var config = require('./lib/config')
var fs = require('fs')

var makingPay = {
    "amount": 120 * 100,
    "currency": "czk",
    "source": "tok_visa_debit",
    "description": "tak jo"
}

helpers.makePayment(makingPay, function(err){
    console.log('this was the error', err)
})

var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res)
})

httpServer.listen(config.httpPort, function(){
    console.log("Server is listening on port", +config.httpPort);
});

var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')

}

var httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res)
}) 

httpsServer.listen(config.httpsPort, function(){
    console.log("Server is listening on port", +config.httpsPort);
});

var unifiedServer = function(req, res){
    var parsedUrl = url.parse(req.url, true);

    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var method = req.method.toLowerCase();

    var queryStringObject = parsedUrl.query;

    var headers = req.headers;

    var decoder = new stringDecoder('utf-8')
    var buffer = ''

    req.on('data', function(data){
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        var data = {
            'trimmedPath': trimmedPath,
            'method': method,
            'queryStringObject': queryStringObject,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, function(statusCode, payload){
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload)

            
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log(trimmedPath, statusCode);
        })
    
    })
};


router = {
    'ahoj': handlers.ahoj,
    'customers': handlers.customers,
    'tokens': handlers.tokens,
    'menu': handlers.menu,
    'shopping-cart': handlers.shoppingCart,
    'orders': handlers.orders
}




