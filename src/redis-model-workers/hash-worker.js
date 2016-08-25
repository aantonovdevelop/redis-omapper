"use strict";

var async = require('async');

module.exports = function (redis) {
    
    function parse (raw) {
        var fields = this.model_schema.fields;
        var model = raw;
        
        return new Promise((resolve) => {
            Object.keys(fields).forEach((field) => {
                fields[field] === 'Array' ? raw[field] = JSON.parse(model[field]) : null;
                fields[field] === 'Object' ? raw[field] = JSON.parse(model[field]) : null;
            });
            
            resolve(model);
        });
    }
    
    function stringify (model) {
        var fields = this.model_schema.fields;
        var raw = model;
        
        return new Promise((resolve) => {
            Object.keys(fields).forEach((field) => {
                fields[field] === 'Array' ? model[field] = JSON.stringify(raw[field]) : null;
                fields[field] === 'Object' ? model[field] = JSON.stringify(raw[field]) : null;
            });
            
            resolve(raw);
        });
    }
    
    return {
        get_model: function (key) {
            return get(key).then(parse.bind(this));
            
            function get (key) {
                return new Promise((resolve, reject) => {
                    redis.hgetall(key, (err, model) => {
                        err ? reject(err) : resolve(model);
                    });
                });
            }
        },
        
        get_many: function (keys) {
            var self = this;
            
            return new Promise((resolve, reject) => {
                var result = [];
                
                async.eachSeries(keys, (key, callback) => {
                    redis.hgetall(key, (err, raw) => {
                        if (err) return callback(err);
                        
                        parse.bind(self)(raw).then((model) => result.push(model)).then(() => callback()).catch(callback);
                    });
                }, (err) => {
                    err ? reject(err) : resolve(result);
                });
            });
        },

        save_model: function (key, model) {
            return stringify.bind(this)(model).then(save);
            
            function save(raw) {
                return new Promise((resolve, reject) => {
                    redis.hmset(key, raw, (err) => {
                        err ? reject(err) : resolve();
                    });
                });
            }
        },
        
        save_field: function (key, field, value) {
            var self = this;
            
            return new Promise((resolve, reject) => {
                var val = (self.model_schema.fields[field] === 'Array') ? JSON.stringify(value) : value;

                let cb = ((err) => { err ? reject(err) : resolve(); }),
                    operation = value ? update_field.bind({}, key, field, val, cb) : remove_field.bind({}, key, field, cb);

                operation();
            });

            function update_field (key, field, val, cb) {
                redis.hset(key, field, val, cb);
            }
            function remove_field (key, field, cb) {
                redis.hdel(key, field, cb);
            }
        },

        delete_model: function (key) {
            return new Promise((resolve, reject) => {
                redis.del(key, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        },
        
        increment: function (key, field, value) {
            return new Promise((resolve, reject) => {
                redis.hincrby(key, field, value, (err, res) => {
                    err ? reject(err) : resolve(res);
                });
            });
        }
    }
};
