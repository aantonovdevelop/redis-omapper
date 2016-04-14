"use strict";

module.exports = function (redis) {
    return {
        get_model: function (key) {
            return new Promise((resolve, reject) => {
                redis.get(key, (err, model) => {
                    err ? reject(err) : resolve(JSON.parse(model));
                });
            });
        },
        
        get_many: function (keys) {
            return new Promise((resolve, reject) => {
                redis.mget(keys, (err, models) => {
                    err ? reject(err) : resolve(parse_models(models));
                    
                    function parse_models(models) {
                        var result = [];
                        
                        models.forEach((model) => result.push(JSON.parse(model)));
                        
                        return result;
                    }
                });
            });
        },
        
        save_model: function (key, model) {
            return new Promise((resolve, reject) => {
                redis.set(key, JSON.stringify(model), (err) => {
                    err ? reject(err) : resolve();
                });
            });
        },
        
        save_field: function () {
            return new Promise((resolve, reject) => {
                reject(new Error('Not implemented exception'));
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