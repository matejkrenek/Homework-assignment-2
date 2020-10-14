/*
 * Request handlers
 * 
 */

// Dependencies
var fs = require('fs');
const lib = require('./data');
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
// Required: first_name, last_name, email_address, streetAddress, zip_code, agreement
// Optional: none
handlers._customers.post = function(data, callback){
    // Check that all of the required data are filled out
    var first_name = typeof(data.payload.first_name) == 'string' && data.payload.first_name.trim().length > 0 && data.payload.first_name.trim().length <= 50 ? data.payload.first_name.trim() : false;
    var last_name = typeof(data.payload.last_name) == 'string' && data.payload.last_name.trim().length > 0 && data.payload.last_name.trim().length <= 50 ? data.payload.last_name.trim() : false;
    var email_address = typeof(data.payload.email_address) == 'string' && data.payload.email_address.trim().length > 0 && data.payload.email_address.trim().indexOf('@') > -1 && data.payload.email_address.trim().indexOf('.') > -1&& (data.payload.email_address.trim().split('.').length -1) >= 2 ? data.payload.email_address.trim() : false;
    var zip_code = typeof(data.payload.zip_code) == 'string' && data.payload.zip_code.trim().length == 5 ? data.payload.zip_code.trim() : false;
    var building_number = typeof(data.payload.building_number) == 'string' && data.payload.building_number.trim().length > 0 && data.payload.building_number.trim().length <= 10 ? data.payload.building_number.trim() : false;
    var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;
    var agreement = typeof(data.payload.agreement) == 'boolean' && data.payload.agreement == true ? true : false;

    if(first_name && last_name && email_address && zip_code && building_number && street && agreement){

        _data.read('customers', email_address, function(err, data){
            if(err){
                // Customer does not exist
                var customerObject = {
                    'first_name': first_name,
                    'last_name': last_name,
                    'email_address': email_address,
                    'zip_code': zip_code,
                    'building_number': building_number,
                    'street': street,
                    'agreement': true
                };

                _data.create('customers', email_address, customerObject, function(err){
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
        callback(400, {'Error': 'Missing required fields '+email_address});
    }
}

// Customers - GET
// Required: email_address
// Optional: none
handlers._customers.get = function(data, callback){
    // Check that all the required data are filled out
    var email_address = typeof(data.queryStringObject.email_address) == 'string' && data.queryStringObject.email_address.trim().length > 0 && data.queryStringObject.email_address.trim().indexOf('@') > -1 && data.queryStringObject.email_address.trim().indexOf('.') > -1&& (data.queryStringObject.email_address.trim().split('.').length -1) >= 2 ? data.queryStringObject.email_address.trim() : false;

    if(email_address){

        var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

        handlers._tokens.verifyTokenValidation(token, email_address, function(tokenIsValid){
            if(tokenIsValid){
                _data.read('customers', email_address, function(err, data){
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
// Required: email_address
// Optional: first_name, last_name, zip_code, building_number, Street
handlers._customers.put = function(data, callback){
    // Check that all the required data are filled out
    var email_address = typeof(data.payload.email_address) == 'string' && data.payload.email_address.trim().length > 0 && data.payload.email_address.trim().indexOf('@') > -1 && data.payload.email_address.trim().indexOf('.') > -1&& (data.payload.email_address.trim().split('.').length -1) >= 2 ? data.payload.email_address.trim() : false;

    // Check for Optional data
    var first_name = typeof(data.payload.first_name) == 'string' && data.payload.first_name.trim().length > 0 && data.payload.first_name.trim().length <= 50 ? data.payload.first_name.trim() : false;
    var last_name = typeof(data.payload.last_name) == 'string' && data.payload.last_name.trim().length > 0 && data.payload.last_name.trim().length <= 50 ? data.payload.last_name.trim() : false;
    var zip_code = typeof(data.payload.zip_code) == 'string' && data.payload.zip_code.trim().length == 5 ? data.payload.zip_code.trim() : false;
    var building_number = typeof(data.payload.building_number) == 'string' && data.payload.building_number.trim().length > 0 && data.payload.building_number.trim().length <= 10 ? data.payload.building_number.trim() : false;
    var street = typeof(data.payload.street) == 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false;

    if(email_address){
        // Check that at least one of the optinal field is filled out
        if(first_name || last_name || zip_code || building_number || street){

            var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

            handlers._tokens.verifyTokenValidation(token, email_address, function(tokenIsValid){
                if(tokenIsValid){
                    _data.read('customers', email_address, function(err, customerData){
                        if(!err && customerData){
                            // Update fields
                            if(first_name){
                                customerData.first_name = first_name;
                            }
                            if(last_name){
                                customerData.last_name = last_name;
                            }
                            if(zip_code){
                                customerData.zip_code = zip_code;
                            }
                            if(building_number){
                                customerData.building_number = building_number;
                            }
                            if(street){
                                customerData.street = street;
                            }
        
                            // Store the new updates
                            _data.update('customers', email_address, customerData, function(err){
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
    var email_address = typeof(data.queryStringObject.email_address) == 'string' && data.queryStringObject.email_address.trim().length > 0 && data.queryStringObject.email_address.trim().indexOf('@') > -1 && data.queryStringObject.email_address.trim().indexOf('.') > -1&& (data.queryStringObject.email_address.trim().split('.').length -1) >= 2 ? data.queryStringObject.email_address.trim() : false;

    if(email_address){

        var token = typeof(data.headers.token) == "string" && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

        handlers._tokens.verifyTokenValidation(token, email_address, function(tokenIsValid){
            _data.read('customers', email_address, function(err, customerData){
                if(!err && customerData){
                    _data.delete('customers', email_address, function(err){
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
    var email_address = typeof(data.payload.email_address) == 'string' && data.payload.email_address.trim().length > 0 && data.payload.email_address.trim().indexOf('@') > -1 && data.payload.email_address.trim().indexOf('.') > -1&& (data.payload.email_address.trim().split('.').length -1) >= 2 ? data.payload.email_address.trim() : false;

    if(email_address){
        _data.read('customers', email_address, function(err, customerData){
            if(!err && customerData){
                // Create token with random name. Set expiration date 1 hour from now
                var tokenID = helpers.createRandomString(20);
                var expires = Date.now() + 1000 * 60 * 60;

                var tokenObject = {
                    'email_address': email_address,
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

handlers._tokens.verifyTokenValidation = function(tokenID, email_address, callback){
    _data.read('tokens', tokenID, function(err, tokenData){
        if(!err && tokenData){
            if(tokenData.email_address == email_address && tokenData.expires > Date.now()){
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
// Required: pizza_name, ingredients, price
// Required for authentication: admin_username, admin_passwrod, admin_token
handlers._menu.post = function(data, callback){
    var pizza_name = typeof(data.payload.pizza_name) == "string" && data.payload.pizza_name.trim().length > 0 ? data.payload.pizza_name.trim() : false;
    var ingredients = typeof(data.payload.ingredients) == "object" && data.payload.ingredients instanceof Array && data.payload.ingredients.length > 0 ? data.payload.ingredients : false;
    var price = typeof(data.payload.price) == "string" && data.payload.price.trim().length > 0 ? data.payload.price.trim() : false;

    if(pizza_name && ingredients && price){

        var admin_username = typeof(data.headers.admin_username) == "string" && data.headers.admin_username.trim().length > 0 ? data.headers.admin_username.trim() : false;
        var admin_password = typeof(data.headers.admin_password) == "string" && data.headers.admin_password.trim().length > 0 ? data.headers.admin_password.trim() : false;
        var admin_token = typeof(data.headers.admin_token) == "string" && data.headers.admin_token.trim().length == 40 ? data.headers.admin_token.trim() : false;

        if(admin_username && admin_password && admin_token){
            _data.read('admin', 'admin', function(err, adminData){
                if(!err && adminData && adminData.adminUsername == admin_username && adminData.adminPassword == admin_password && adminData.adminToken == admin_token){
                    _data.read('menu', pizza_name, function(err, menuData){
                        if(err){
                            var pizzaObject = {
                                "name": pizza_name,
                                "ingredients": ingredients,
                                "price": price
                            }
                            _data.create('menu', pizza_name, pizzaObject, function(err){
                                if(!err){
                                    callback(200)
                                } else{
                                    callback(500, {'Error': 'Could not create new pizza record'})
                                }
                            })
                        } else{
                            callback(400, {'Error': `Pizza with this name is already exist`})
                        }
                    });
                } else{
                    callback(400, {'Error': 'Admin with these informations may not exist'})
                }
            })
        } else{
            callback(400, {'Error': `Requried fields for authentication are not filled out`})
        }
        

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Menu - GET
// Required: tokenID
// @TODO only let a log in customer to get menu list
handlers._menu.get = function(data, callback){
    var tokenID = typeof(data.queryStringObject.tokenID) == 'string' && data.queryStringObject.tokenID.trim().length == 20 ? data.queryStringObject.tokenID.trim() : false;

    if(tokenID){
        _data.read('tokens', tokenID, function(err, tokenData){
            if(!err && tokenData.expires > Date.now()){
                _data.list('menu', function(err, files){
                    if(!err && files){
                        var trimmedMenu = []
                        files.forEach(function(file){
                            trimmedMenu.push(file.replace('.json', ''))
                        })
                        callback(200, {'menu_list': trimmedMenu})
                    } else{
                        callback(400, {'Error': 'Directory may not exist'});
                    }
                })
            } else{
                callback(400, {'Error': `Token does not exist or is not valid ${tokenID}`})
            }
        })
    } else{
        callback(400, {'Error': 'Missing required data'})
    }
}


// Menu - PUT
// Required : pizza_name
// Required for authentication: admin_username, admin_passwrod, admin_token
// Optional: ingredients, price (at least one must to be declared)
handlers._menu.put = function(data, callback){
    // Required data
    var pizza_name = typeof(data.payload.pizza_name) == "string" && data.payload.pizza_name.trim().length > 0 ? data.payload.pizza_name.trim() : false;

    // Optional data
    var ingredients = typeof(data.payload.ingredients) == "object" && data.payload.ingredients instanceof Array && data.payload.ingredients.length > 0 ? data.payload.ingredients : false;
    var price = typeof(data.payload.price) == "string" && data.payload.price.trim().length > 0 ? data.payload.price.trim() : false;

    if(pizza_name){
        if(ingredients || price){       
            var admin_username = typeof(data.headers.admin_username) == "string" && data.headers.admin_username.trim().length > 0 ? data.headers.admin_username.trim() : false;
            var admin_password = typeof(data.headers.admin_password) == "string" && data.headers.admin_password.trim().length > 0 ? data.headers.admin_password.trim() : false;
            var admin_token = typeof(data.headers.admin_token) == "string" && data.headers.admin_token.trim().length == 40 ? data.headers.admin_token.trim() : false; 

            if(admin_username && admin_password && admin_token){
                _data.read('admin', 'admin', function(err, adminData){
                    if(!err && adminData && adminData.adminUsername == admin_username && adminData.adminPassword == admin_password && adminData.adminToken == admin_token){
                        _data.read('menu', pizza_name, function(err, menuData){
                            if(!err && menuData){
                                if(ingredients){
                                    menuData.ingredients = ingredients
                                }
                                if(price){
                                    menuData.price = price
                                }

                                _data.update('menu', pizza_name, menuData, function(err){
                                    if(!err){
                                        callback(200)
                                    } else{
                                        callback(500, {'Error': 'Could not update the file'})
                                    }
                                })
                            } else{
                                callback(400, {'Error': 'Item on the menu list may not exist'})
                            }
                        })
                    } else{
                        callback(400, {'Error': 'Admin with these informations may not exist'})
                    }
                })
            } else{
                callback(400, {'Error': `Requried fields for authentication are not filled out`})
            }

        } else{
            callback(400, {'Error': 'Missing fields to update'});
        }
    }else{
        callback(400, {'Error': 'Missing required fields'});
    }

}

// Menu - DELETE
// Required : pizza_name
// Required for authentication: admin_username, admin_passwrod, admin_token
// @TODO only let a admin or some autheticated person to remove items from the menu list
handlers._menu.delete = function(data, callback){
    var pizza_name = typeof(data.queryStringObject.pizza_name) == "string" && data.queryStringObject.pizza_name.trim().length > 0 ? data.queryStringObject.pizza_name.trim() : false;
    
    if(pizza_name){
        var admin_username = typeof(data.headers.admin_username) == "string" && data.headers.admin_username.trim().length > 0 ? data.headers.admin_username.trim() : false;
        var admin_password = typeof(data.headers.admin_password) == "string" && data.headers.admin_password.trim().length > 0 ? data.headers.admin_password.trim() : false;
        var admin_token = typeof(data.headers.admin_token) == "string" && data.headers.admin_token.trim().length == 40 ? data.headers.admin_token.trim() : false; 

        if(admin_username && admin_password && admin_token){
            if(admin_username && admin_password && admin_token){
                _data.read('admin', 'admin', function(err, adminData){
                    if(!err && adminData && adminData.adminUsername == admin_username && adminData.adminPassword == admin_password && adminData.adminToken == admin_token){
                        _data.read('menu', pizza_name, function(err, menuData){
                            if(!err && menuData){
                                _data.delete('menu', pizza_name, function(err){
                                    if(!err){
                                         callback(200)
                                    } else{
                                        callback(500, {'Error': 'Could not delete item from the menu list'})
                                    }
                                })
                            } else{
                                callback(400, {'Error': 'Specified item may not exist in the menu list'})
                            }
                        })
                    } else{
                        callback(400, {'Error': 'Admin with these informations may not exist'})
                    }
                })
            } else{
                callback(400, {'Error': `Requried fields for authentication are not filled out`})
            }
        } else{
            callback(400, {'Error': 'Requried fields for authentication are not filled out'})
        }

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}

//ShoppingCart hadler
handlers.shoppingCart = function(data, callback){
    var optionalMethods = ['post', 'get', 'put', 'delete'];
    if(optionalMethods.indexOf(data.method) > -1){
        handlers._shoppingCart[data.method](data, callback);
    } else{
        callback(405);
    }
}

handlers._shoppingCart = {};

// ShoppingCart - POST
handlers._shoppingCart.post = function(data, callback){
    
}
// ShoppingCart - GET
// ShoppingCart - PUT
// ShoppingCart - DELETE













// export module
module.exports = handlers