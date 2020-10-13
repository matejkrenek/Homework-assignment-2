// Dependencies
var url = require('url');
var http = require('http');
var stringDecoder = require('string_decoder').StringDecoder;
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');



var server = http.createServer(function(req, res){
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
});


router = {
    'ahoj': handlers.ahoj,
    'customers': handlers.customers,
    'tokens': handlers.tokens,
    'menu': handlers.menu
}


server.listen(3000, function(){
    console.log("Server is listening on port 3000");
});

