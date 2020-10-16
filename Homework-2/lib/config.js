/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'stripe': {
    'secretKey': 'sk_test_51HcVv3LSuYrWubfMMYedTRXYIHmHTGN3lv2nQwxeMSKlyqXDYISx1MzMuFUPb4BGsqx8zRxYT0VTO6BYVLQdJvon00PfXAxhah',
  }

};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'stripe': {
    'secretKey': 'sk_test_51HcVv3LSuYrWubfMMYedTRXYIHmHTGN3lv2nQwxeMSKlyqXDYISx1MzMuFUPb4BGsqx8zRxYT0VTO6BYVLQdJvon00PfXAxhah',
  }

};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
