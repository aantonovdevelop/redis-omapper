'use strict';

var async = require('async');
var ForeignKey = require('./foreign-key');

class ManyToManyKey extends ForeignKey {
    
    constructor (key, dkey, redis) {
        super();
        
        this.key = key;
        this.dkey = dkey;
        this.redis = redis;
    }
    
    update_key (keyValues, modelVal) {
        var self = this;
        
        return new Promise((resolve, reject) => {
            async.eachSeries(keyValues, add_value_to_key, err => err ? reject(err) : resolve());
        });
        
        function add_value_to_key(value, callback) {
            self.redis.sadd(self.key + value, modelVal, callback);
        }
    }
    
    get_values (keyValues) {
        var self = this;

        return new Promise((resolve, reject) => {
            self.redis.sinter(generate_full_keys(keyValues), (err, res) => 
                err ? reject(err) : resolve(res));
        });
        
        function generate_full_keys(values) {
            var full_keys = [];

            values.forEach((values) => {
                full_keys.push(self.key + values);
            });

            return full_keys;
        }
    }
    
    delete_key (keyValues, modelVal) {
        var self = this;
        
        return new Promise((resolve, reject) => {
            async.eachSeries(keyValues, delete_key, err => err ? reject(err) : resolve(err));
        }).then(() => delete_dkey(modelVal));
        
        function delete_key(value, callback) {
            self.redis.srem(self.key + value, modelVal, callback);
        }
        
        function delete_dkey(value) {
            return new Promise((resolve, reject) => {
                self.redis.del(self.dkey + value, err => err ? reject(err) : resolve());
            });
        }
    }
    
    get_keys (keyValues) {
        var self = this;
        
        return new Promise((resolve) => {
            resolve(generate_full_keys(keyValues));
        });
        
        function generate_full_keys(values) {
            var full_keys = [];
            
            values.forEach((value) => {
                full_keys.push(self.key + value);
            });
            
            return full_keys;
        }
    }
}

module.exports = ManyToManyKey;
