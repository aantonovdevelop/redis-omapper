"use strict";

var async = require('async');

module.exports = function (redis) {
    return {
        get_model: function (key) {
            return new Promise((resolve, reject) => {
                redis.hgetall(key, (err, model) => {
                    err ? reject(err) : resolve(model);
                });
            });
        },

        get_many: function (keys) {
            return new Promise((resolve, reject) => {
                var result = [];
                
                async.eachSeries(keys, (key, callback) => {
                    redis.hgetall(keys, (err, model) => {
                        if (err) return callback(err);
                        
                        result.push(model);
                        
                        callback();
                    });
                }, (err) => {
                    err ? reject(err) : resolve(result);
                });
            });
        },

        save_model: function (key, model) {
            return new Promise((resolve, reject) => {
                redis.hmset(key, model, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        },
        
        save_field: function (key, field, value) {
            return new Promise((resolve, reject) => {
                redis.hset(key, field, value, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        },

        delete_model: function (key) {
            return new Promise((resolve, reject) => {
                redis.del(key, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        }
    }
};
