'use strict';

var async = require('async');
var ForeignKey = require('./foreign-key');

class ManyToOneKey extends ForeignKey {
    
    constructor (key, redis) {
        super();
        
        this.key = key;
        this.redis = redis;
    }
    
    update_key (keyValues, modelVal) {
        var self = this;
        
        return new Promise((resolve, reject) => {
            async.eachSeries(keyValues, (keyVal, callback) => {
                self.redis.sadd(self.key + keyVal, modelVal, (err) => {
                    callback(err);
                });
            }, (err) => {
                err ? reject(err) : resolve();
            });
        });
    }
    
    get_values (keyValues) {
        var self = this;

        return new Promise((resolve, reject) => {
            var full_keys = [];
            
            keyValues.forEach((keyVal) => {
                full_keys.push(self.key + keyVal);
            });
                
            self.redis.sinter(full_keys, (err, res) => {
                err ? reject(err) : resolve(res);
            });
        });
    }
    
    delete_key (keyVals, modelVal) {
        var self = this;
        
        return new Promise((resolve, reject) => {
            async.eachSeries(keyVals, (keyVal, callback) => {
                self.redis.srem(self.key + keyVal, modelVal, (err) => {
                    callback(err);
                });
            }, (err) => {
                err ? reject(err) : resolve(err);
            });
        });
    }
}

module.exports = ManyToOneKey;