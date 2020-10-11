/*
 * Helpers for repeating tasks
 *
 */

// Dependencies

var helpers = {};

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


// export module
module.exports = helpers