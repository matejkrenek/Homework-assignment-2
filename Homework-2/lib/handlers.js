/*
 * Request handlers
 * 
 */

// Dependencies
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
// @TODO only let the authenticated customer access the data
handlers._customers.get = function(data, callback){
    // Check that all the required data are filled out
    var emailAddress = typeof(data.queryStringObject.emailAddress) == 'string' && data.queryStringObject.emailAddress.trim().length > 0 && data.queryStringObject.emailAddress.trim().indexOf('@') > -1 && data.queryStringObject.emailAddress.trim().indexOf('.') > -1&& (data.queryStringObject.emailAddress.trim().split('.').length -1) >= 2 ? data.queryStringObject.emailAddress.trim() : false;

    if(emailAddress){
        _data.read('customers', emailAddress, function(err, data){
            if(!err && data){
                callback(200, data)
            } else{
                callback(404)
            }
        });
    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}


// Customers - PUT
// Required: emailAddress
// Optional: firstName, lastName, zipCode, buildingNumber, Street
// @TODO only let the authenticated customer update their data
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
            callback(400, {'Error': 'Missing fields to update'})
        }

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Customers - DELETE
// Required: email
// Optional: none
// @TODO only let the authenticated customer delete theirs files
// @TODO cleanup all checks connected to the customer
handlers._customers.delete = function(data, callback){
    // Check that all required data are filled out
    var emailAddress = typeof(data.queryStringObject.emailAddress) == 'string' && data.queryStringObject.emailAddress.trim().length > 0 && data.queryStringObject.emailAddress.trim().indexOf('@') > -1 && data.queryStringObject.emailAddress.trim().indexOf('.') > -1&& (data.queryStringObject.emailAddress.trim().split('.').length -1) >= 2 ? data.queryStringObject.emailAddress.trim() : false;

    if(emailAddress){
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

    } else{
        callback(400, {'Error': 'Missing required fields'})
    }
}




// export module
module.exports = handlers