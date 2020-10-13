/*
 * Request handlers
 * 
 */

// Dependencies
var fs = require('fs')
var _data = require('./data');
var helpers = require('./helpers');


var handlers = {}

handlers.ahoj = function(data, callback){
    callback(200, {'res': data.method});
};

handlers.notFound = function(data, callback){
    callback(404,{'Error': 'Not Found'} );

};

// Customers
handlers.customers = function(data, callback){
    
    var optionalMethods = ['post', 'get', 'put', 'delete'];
    if(optionalMethods.indexOf(data.method) > -1){
        handlers._customers[data.method](data, callback);
    } else{
        callback(405, data.method);
    }
};

handlers._customers = {};

// Customers - POST
// Required: firstName, lastName, emailAddress, streetAddress, zipcode, agreement
// Optional: none
handlers._customers.post = function(data, callback){
    // Check that all of the required data are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 && data.payload.firstName.trim().length <= 50 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 && data.payload.lastName.trim().length <= 50 ? data.payload.lastName.trim() : false;
    var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 && data.payload.emailAddress.trim().indexOf('@') > -1 && data.payload.emailAddress.trim().indexOf('.') > -1&& (data.payload.emailAddress.trim().split('.').length -1) >= 2 ? data.payload.emailAddress.trim() : false;
    var zipCode = typeof(data.payload.zipCode) == 'string' && data.payload.zipCode.trim().length == 5 ? data.payload.zipCode.trim() : false;
    var buildingNumber = typeof(data.payload.buildingNumber) == 'string' && data.payload.buildingNumber.trim().length > 0 && data.payload.buildingNumber.trim().length <= 10 ? data.payload.buildingNumber.trim() : false;
    var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
    var agreement = typeof(data.payload.agreement) == 'boolean' && data.payload.agreement == true ? true : false;

    if(firstName && lastName && emailAddress && zipCode && buildingNumber && street && agreement){

        _data.read('customers', emailAddress, function(err, data){
            if(err){
                // Customer does not exist
                var customerObject = {
                    'firstName': firstName,
                    'lastName': lastName,
                    'emailAddress': emailAddress,
                    'zipCode': zipCode,
                    'buildingNumber': buildingNumber,
                    'street': street,
                    'agreement': true
                };

                _data.create('customers', emailAddress, customerObject, function(err){
                    if(!err){
                        callback(200)
                    } else{
                        callback(500, {'Error': 'Could not register the new customer'});
                    }
                })
            } else{
                callback(400, {'Error': 'A customer with this email address already exist'});
            }
        })

    } else{
        callback(400, {'Error': 'Missing required fields '+emailAddress});
    }
}

// Customers - GET
// Required: emailAddress
// Optional: none
handlers._customers.get = function(data, callback){
    // Check that all the required data are filled out
    var emailAddress = typeof(data.queryStringObject.emailAddress) == 'string' && data.queryStringObject.emailAddress.trim().length > 0 && data.queryStringObject.emailAddress.trim().indexOf('@') > -1 && data.queryStringObject.emailAddress.trim().indexOf('.') > -1&& (data.queryStringObject.emailAddress.trim().split('.').length -1) >= 2 ? data.queryStringObject.emailAddress.trim() : false;

    if(emailAddress){

        var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

        handlers._tokens.verifyTokenValidation(token, emailAddress, function(tokenIsValid){
            if(tokenIsValid){
                _data.read('customers', emailAddress, function(err, data){
                    if(!err && data){
                        callback(200, data)
                    } else{
                        callback(404)
                    }
                });
            } else{
                callback(403, {'Error': 'Missing required token in the header, or the token is invalid'})
            }
        })

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}


// Customers - PUT
// Required: emailAddress
// Optional: firstName, lastName, zipCode, buildingNumber, Street
handlers._customers.put = function(data, callback){
    // Check that all the required data are filled out
    var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 && data.payload.emailAddress.trim().indexOf('@') > -1 && data.payload.emailAddress.trim().indexOf('.') > -1&& (data.payload.emailAddress.trim().split('.').length -1) >= 2 ? data.payload.emailAddress.trim() : false;

    // Check for Optional data
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 && data.payload.firstName.trim().length <= 50 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 && data.payload.lastName.trim().length <= 50 ? data.payload.lastName.trim() : false;
    var zipCode = typeof(data.payload.zipCode) == 'string' && data.payload.zipCode.trim().length == 5 ? data.payload.zipCode.trim() : false;
    var buildingNumber = typeof(data.payload.buildingNumber) == 'string' && data.payload.buildingNumber.trim().length > 0 && data.payload.buildingNumber.trim().length <= 10 ? data.payload.buildingNumber.trim() : false;
    var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;

    if(emailAddress){
        // Check that at least one of the optinal field is filled out
        if(firstName || lastName || zipCode || buildingNumber || street){

            var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

            handlers._tokens.verifyTokenValidation(token, emailAddress, function(tokenIsValid){
                if(tokenIsValid){
                    _data.read('customers', emailAddress, function(err, customerData){
                        if(!err && customerData){
                            // Update fields
                            if(firstName){
                                customerData.firstName = firstName;
                            }
                            if(lastName){
                                customerData.lastName = lastName;
                            }
                            if(zipCode){
                                customerData.zipCode = zipCode;
                            }
                            if(buildingNumber){
                                customerData.buildingNumber = buildingNumber;
                            }
                            if(street){
                                customerData.street = street;
                            }
        
                            // Store the new updates
                            _data.update('customers', emailAddress, customerData, function(err){
                                if(!err){
                                    callback(200)
                                } else{
                                    callback(500, {'Error': 'Could not update the customer\'s data'})
                                }
                            })
                        } else{
                            callback(400, {'Error': 'Speciefied customer does not exist'})
                        }
                    });
        
                } else{
                    callback(403, {'Error': 'Missing required token in the header, or the token is invalid'})
                }
            })

            
        } else{
            callback(400, {'Error': 'Missing fields to update'})
        }

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Customers - DELETE
// Required: email
// Optional: none
handlers._customers.delete = function(data, callback){
    // Check that all required data are filled out
    var emailAddress = typeof(data.queryStringObject.emailAddress) == 'string' && data.queryStringObject.emailAddress.trim().length > 0 && data.queryStringObject.emailAddress.trim().indexOf('@') > -1 && data.queryStringObject.emailAddress.trim().indexOf('.') > -1&& (data.queryStringObject.emailAddress.trim().split('.').length -1) >= 2 ? data.queryStringObject.emailAddress.trim() : false;

    if(emailAddress){

        var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

        handlers._tokens.verifyTokenValidation(token, emailAddress, function(tokenIsValid){
            _data.read('customers', emailAddress, function(err, customerData){
                if(!err && customerData){
                    _data.delete('customers', emailAddress, function(err){
                        if(!err){
                            callback(200)
                        } else{
                            callback(500, {'Error': 'Could not delete the user'})
                        }
                    })
                } else{
                    callback(400, {'Error': 'Could not find the specified user'})
                }
            })
        });

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}

handlers.tokens = function(data, callback){
    var optionalMethods = ['post', 'get', 'put', 'delete'];
    if(optionalMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    } else{
        callback(405);
    }
};

handlers._tokens = {};

// Tokens - POST
// Required: email
handlers._tokens.post = function(data, callback){
    var emailAddress = typeof(data.payload.emailAddress) == 'string' && data.payload.emailAddress.trim().length > 0 && data.payload.emailAddress.trim().indexOf('@') > -1 && data.payload.emailAddress.trim().indexOf('.') > -1&& (data.payload.emailAddress.trim().split('.').length -1) >= 2 ? data.payload.emailAddress.trim() : false;

    if(emailAddress){
        _data.read('customers', emailAddress, function(err, customerData){
            if(!err && customerData){
                // Create token with random name. Set expiration date 1 hour from now
                var tokenID = helpers.createRandomString(20);
                var expires = Date.now() + 1000 * 60 * 60;

                var tokenObject = {
                    'emailAddress': emailAddress,
                    'tokenID': tokenID,
                    'expires': expires
                };
                
                // store the tokenObject
                _data.create('tokens', tokenID, tokenObject, function(err){
                    if(!err){
                        callback(200, tokenObject);
                    } else{
                        callback(500, {'Error': 'Could not create the new token'});
                    }
                })
            } else{
                callback(404, {'Error': 'Could not find the specified customer'});
            }
        });
    };
};
// Tokens - GET
// Required: tokenID
handlers._tokens.get = function(data, callback){
    var tokenID = typeof(data.queryStringObject.tokenID) == 'string' && data.queryStringObject.tokenID.trim().length == 20 ? data.queryStringObject.tokenID.trim() : false;

    if(tokenID){
        _data.read('tokens', tokenID, function(err, tokenData){
            if(!err && tokenData){
                callback(200, tokenData)
            } else{
                callback(404)
            }
        })
    } else{
        callback(400, {'Error': 'Missing required field, or field invalid'})
    }
}

// Tokens - PUT
// Required: tokenID, extend
// Optional: none
handlers._tokens.put = function(data, callback){
    var tokenID = typeof(data.payload.tokenID) == 'string' && data.payload.tokenID.trim().length == 20 ? data.payload.tokenID.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if(tokenID && extend){
        _data.read('tokens', tokenID, function(err, tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    _data.update('tokens', tokenID, tokenData, function(err){
                        if(!err){
                            callback(200)
                        } else{
                            callback(500, {'Error': 'Could not update the token'})
                        }
                    })
                } else{
                    callback(400, {'Error': 'Token has already expires'})
                }
            } else{
                callback(405, {'Error': 'Could not find specified token'})
            }
        }) 

    } else{
        callback(400, {'Error':'Missing required fields'})
    }
}
// Tokens - DELETE
// Required: tokenID
handlers._tokens.delete = function(data, callback){
    var tokenID = typeof(data.queryStringObject.tokenID) == 'string' && data.queryStringObject.tokenID.trim().length == 20 ? data.queryStringObject.tokenID.trim() : false;

    if(tokenID){
        _data.read('tokens', tokenID, function(err, tokenData){
            if(!err && tokenData){
                _data.delete('tokens', tokenID, function(err){
                    if(!err){
                        callback(200)
                    } else{
                        callback(500, {'Error': 'Could not delete the token'})
                    }
                })
            } else{
                callback(400, {'Error': 'Could not find specified token'})
            }
        })
    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}

handlers._tokens.verifyTokenValidation = function(tokenID, emailAddress, callback){
    _data.read('tokens', tokenID, function(err, tokenData){
        if(!err && tokenData){
            if(tokenData.emailAddress == emailAddress && tokenData.expires > Date.now()){
                callback(true)
            } else{
                callback(false)
            }
        } else{
            callback(false)
        }
    })
}

handlers.menu = function(data, callback){
    var optionalMethods = ['post', 'get', 'put', 'delete'];
    if(optionalMethods.indexOf(data.method) > -1){
        handlers._menu[data.method](data, callback)
    } else{
        callback(405)
    }
};

handlers._menu = {}

// Menu - POST
// @TODO only let a admin or some autheticated person to add items to the menu list (adminUsername, adminPassword, adminToken)
// Required: pizzaName, ingredients, price
handlers._menu.post = function(data, callout){
    var pizzaName = typeof(data.payload.pizzaName) == "string" && data.payload.pizzaName.trim().length > 0 ? data.payload.pizzaName.trim() : false;
    var ingredients = typeof(data.payload.ingredients) == "object" && data.payload.ingredients instanceof Array && data.payload.ingredients.length > 0 ? data.payload.ingredients : false;
    var price = typeof(data.payload.price) == "string" && data.payload.price.trim().length > 0 ? data.payload.price.trim() : false;

    if(pizzaName && ingredients && price){
        _data.read('menu', pizzaName, function(err, menuData){
            if(err){
                var pizzaObject = {
                    "name": pizzaName,
                    "ingredients": ingredients,
                    "price": price
                }
                _data.create('menu', pizzaName, pizzaObject, function(err){
                    if(!err){
                        callout(200)
                    } else{
                        callout(500, {'Error': 'Could not create new pizza record'})
                    }
                })
            } else{
                callout(400, {'Error': `Pizza with this name is already exist`})
            }
        })
    } else{
        callout(400, {'Error': 'Missing required fields'})
    }
}

// Menu - GET
// Required: tokenID
// @TODO only let a log in customer to get menu list
handlers._menu.get = function(data, callback){
    var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    if(token){
        _data.read('tokens', token, function(err, tokenData){
            if(!err && tokenData.expires > Date.now()){
                _data.list('menu', function(err, data){
                    if(!err && data){
                        var trimmedObject = []
                        data.forEach(function(fileName){
                            var file = fileName.replace('.json', '')
                            _data.read('menu', file, function(err, data){
                                if(!err && data){
                                    callback(200, data)
                                } else{
                                    callback(400, {'Error': 'File may not exist'})
                                }
                            });
                        })
                    } else{
                        callback(400, {'Error': `Could not find folder ${data}`})
                    }
                })
            } else{
                callback(400, {'Error': 'Token is not valid'})
            }
        })
    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}


// Menu - PUT
// @TODO only let a admin or some autheticated person to edit items inside of the menu list

// Menu - DELETE
// @TODO only let a admin or some autheticated person to remove items from the menu list










// export module
module.exports = handlers