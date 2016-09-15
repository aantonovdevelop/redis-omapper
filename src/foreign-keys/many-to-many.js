'use strict';

var async = require('async');
var ForeignKey = require('./foreign-key');
var _ = require('underscore');

class ManyToManyKey extends ForeignKey {
    
    constructor (key, dkey, redis) {
        super();
        
        this.key = key;
        this.dkey = dkey;
        this.redis = redis;
    }

    /**
     *
     * @param {Array} keyValues
     * @param {Number} modelVal
     *
     * @returns {Promise}
     */
    update_key (keyValues, modelVal) {
        var self = this,
            p = [],
            model_value = Number(modelVal);

        keyValues.forEach(value => {
            p.push(add_value_to_key(value));
        });
        
        return Promise.all(p)
            .then(get_previously_keys)
            .then(update_second_keys)
            .then(() => update_dkey(keyValues));

        function get_previously_keys() {
            return new Promise((resolve, reject) => {
                self.redis.smembers(self.dkey + model_value, (err, keys) => {
                    err ? reject(err) : resolve(keys ? keys : []);
                });
            });
        }

        function update_second_keys(old) {
            return new Promise((resolve, reject) => {
               let keys = _.difference(old, keyValues);

                async.eachSeries(keys, (key, callback) => {
                    self.redis.srem(self.key + key, model_value, err => err ? callback(err) : callback());
                }, err => {
                    err ? reject(err) : resolve();
                });
            });
        }

        function add_value_to_key(value) {
            return new Promise((resolve, reject) => {
                self.redis.sadd(self.key + value, model_value, (err) => err ? reject(err) : resolve());
            });
        }

        function update_dkey(values) {
            if (values.length <= 0) return Promise.resolve();
            
            return new Promise((resolve, reject) => {
                self.redis.multi()
                    .del(self.dkey + model_value)
                    .sadd(self.dkey + model_value, values)
                    .exec_atomic((err) => {
                        err ? reject(err) : resolve();
                    });
            });
        }
    }

    /**
     *
     * @param {Number} id
     * @returns {Promise}
     */
    get_depended_values(id) {
        return new Promise((resolve, reject) => {
            this.redis.smembers(this.dkey + id, (err, values) => {
                err ? reject(err) : resolve(values);
            });
        })
    }

    /**
     *
     * @param {Array} keyValues
     * @returns {Promise}
     */
    get_values (keyValues) {
        const key_values = keyValues || [];

        return new Promise((resolve, reject) => {
            this.redis.sinter(generate_full_keys(this.key, key_values), (err, res) =>
                err ? reject(err) : resolve(res));
        });
    }

    /**
     *
     * @param {Array} keyValues
     * @param {Number} modelVal
     * @returns {Promise}
     */
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

    /**
     *
     * @param {Array} keyValues
     * @returns {Promise}
     */
    get_keys (keyValues) {
        const key_values = keyValues || [];

        return Promise.resolve(generate_full_keys(this.key, key_values));
    }
}

/**
 *
 * @param key
 * @param values
 * @returns {Array}
 */
function generate_full_keys(key, values) {
    if (!(values instanceof Array)) throw new Error("Wrong values argument type");

    let full_keys = [];

    values.forEach(values => full_keys.push(key + values));

    return full_keys;
}

module.exports = ManyToManyKey;
