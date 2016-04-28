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
        var p = [];
        
        keyValues.forEach(value => {
            p.push(add_value_to_key(value));
        });
        
        return Promise.all(p).then(() => update_dkey(keyValues));
        
        function add_value_to_key(value) {
            return new Promise((resolve, reject) => {
                self.redis.sadd(self.key + value, modelVal, (err) => err ? reject(err) : resolve());
            });
        }

        function update_dkey(values) {
            return new Promise((resolve, reject) => {
                self.redis.multi()
                    .del(self.dkey + modelVal)
                    .sadd(self.dkey + modelVal, values)
                    .exec_atomic((err) => {
                        err ? reject(err) : resolve();
                    });
            });
        }
    }
    
    get_depended_values(id) {
        var self = this;
        
        return new Promise((resolve, reject) => {
            self.redis.smembers(self.dkey + id, (err, values) => {
                err ? reject(err) : resolve(values);
            });
        })
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
