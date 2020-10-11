/*
 * Library for creating, reading, editing and deleting files
 *
 */

// Dependencies
const { LOADIPHLPAPI } = require('dns');
var fs = require('fs');
var path = require('path')

var lib = {};

lib.storeDir = path.join(__dirname, '/../.data/')

// Write data to a file
// dir - directory inside of storeDir
// file - name of the file
// data - what we want to store inside the file
lib.create = function(dir, file, data, callback){
    fs.open(lib.storeDir+dir+'/'+file+'.json', 'wx', function(err, fd){
        if(!err && fd){

            var stringData = JSON.stringify(data)

            fs.writeFile(fd, stringData, function(err){
                if(!err){
                    fs.close(fd, function(err){
                        if(!err){
                            callback(false)
                        } else{
                            callback('Could not close the new file');
                        }
                    })
                } else{
                    callback('Could not write to the new file');
                }
            })


        } else{
            callback('Could not create new file (file may already exist)');
        }
    });
};

// Read data from a file
lib.read = function(dir, file, callback){
    fs.readFile(lib.storeDir+dir+'/'+file+'.json', 'utf-8', function(err, data){
        if(!err && data){
            var parsedData = JSON.parse(data);
            callback(false, parsedData);
        } else{
            callback(err, data);
        }
    });
};
// Edit data in a file
lib.update = function(dir, file, data, callback){
    fs.open(lib.storeDir+dir+'/'+file+'.json', 'r+', function(err, fd){
        if(!err && fd){
            var stringData = JSON.stringify(data);

            fs.ftruncate(fd, 0, function(err){
                if(!err){
                    fs.writeFile(fd, stringData, function(err){
                        if(!err){
                            fs.close(fd, function(err){
                                if(!err){
                                    callback(false);
                                } else{
                                    callback('Could not open the file');
                                }
                            })
                        } else{
                            callback('Could not write to the file');
                        }
                    })
                } else{
                    callback('Could not truncate the file');
                }
            })
        } else{
            callback('Could not open file for updating (it may not exist)');
        }
    });
};

// Delete a file
lib.delete = function(dir, file, callback){
    fs.unlink(lib.storeDir+dir+'/'+file+'.json', function(err){
        if(!err){
            callback(false);
        } else{
            callback('Could not find the file');
        }
    });
};






module.exports = lib;