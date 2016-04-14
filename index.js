'use strict';

var model_factory = require('./src/model-factory');
var repository_factory = require('./src/repository-factory');

var keys = require('./src/foreign-keys');

module.exports = {
    model_factory: model_factory,
    
    keys: keys,
    
    create_string_repository: function (model, redis) {
        repository_factory.create_string_repository(model, redis);
    },
    
    create_hash_repository: function (model, redis) {
        repository_factory.create_hash_repository(model, redis);
    }
};
