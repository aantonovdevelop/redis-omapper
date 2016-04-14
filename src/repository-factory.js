"use strict";

var string_worker = require('./redis-model-workers/string-worker');
var hash_worker = require('./redis-model-workers/hash-worker');

var Repository = require('./repository');

module.exports = {
    create_string_repository: function (model, redis) {
        return new Repository(model, string_worker(redis), redis);
    },
    
    create_hash_repository: function (model, redis) {
        return new Repository(model, hash_worker(redis), redis);
    }
};
