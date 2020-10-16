/*
 * Helpers for repeating tasks
 *
 */

// Dependencies

var helpers = {};
var https = require('https');
var querystring = require('querystring');
var config = require('./config')
var https = require('https');
var url = require('url')

// Create a random string for token or for id
helpers.createRandomString = function(stringLength){
    stringLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength : false;

    if(stringLength){
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var string = ''
        for(i = 1; i <= stringLength; i++){
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            string += randomCharacter;
        }
        return string;
    } else{
        return false;
    }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.makePayment = function (data, callback) {

  var payload = {
    amount: data.amount,
    currency: data.currency,
    source: data.source,
    description: data.description
  };

  var stringPayload = querystring.stringify(payload);

  var requestDetails = {
    protocol: "https:",
    hostname: "api.stripe.com",
    port: 443,
    method: "POST",
    path: "/v1/charges",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
      Authorization: `Bearer ${config.stripe.secretKey}`
    }
  };

  // Instantiate the request object
  var req = https.request(requestDetails, res => {
    // Grab the status of the sent request
    var status = res.statusCode;
    // Callback successfully if the request went through
    if (status === 200 || status === 201) {
      callback(false);
    } else {
      callback('Status code returned was ' + status);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', err => {
    callback(err);
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();

};

// export module
module.exports = helpers