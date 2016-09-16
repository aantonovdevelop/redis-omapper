'use strict';

var ForeignKey = require('../foreign-keys/foreign-key');

class OneToManyKey extends ForeignKey {

    /**
     * Create one to many key instance
     * 
     * @param {String} key Key in redis
     * @param {Object} redis Redis db
     */
    constructor (key, redis) {
        super();
        
        this.key = key;
        this.redis = redis;
    }

    /**
     * Update key in db
     * 
     * @param keyVal
     * @param modelVal
     * @returns {Promise}
     */
    update_key (keyVal, modelVal) {
        var self = this,
            full_key = self.key + keyVal,
            model_value = Number(modelVal);
        
        return remove_previous.call(this, modelVal)
            .then(save_key.call(this, full_key, model_value))
            .then(() => save_metha.call(this, keyVal));

        function remove_previous(id) {
            return get_metha.call(this)
                .then(val => {
                    this.redis.srem(this.key + val, id, err => {
                        if (err) return Promise.reject(err);
                        else return Promise.resolve();
                    });
                });
        }

        function save_key (key, val) {
            return new Promise ((resolve, reject) => {
                this.redis.sadd(key, val, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        }

        function save_metha(val) {
            return new Promise((resolve, reject) => {
                this.redis.set(this.id, val, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        }

        function get_metha() {
            return new Promise((resolve, reject) => {
                this.redis.get(this.id, (err, val) => {
                    err ? reject(err) : resolve(val);
                });
            });
        }
    }

    /**
     * Get values
     * 
     * @param keyVal
     * @returns {Promise}
     */
    get_values (keyVal) {
        var self = this,
            full_key = self.key + keyVal;
        
        return new Promise((resolve, reject) => {
            self.redis.smembers(full_key, (err, res) => {
                (err) ? reject(err) : resolve(res);
            });
        });
    }
    
    /**
     * Delete key from db
     * 
     * @param keyVal
     * @param modelVal
     * @returns {Promise}
     */
    delete_key (keyVal, modelVal) {
        var self = this,
            full_key = self.key + keyVal;
        
        return new Promise((resolve, reject) => {
            self.redis.srem(full_key, modelVal, (err) => {
                err ? reject(err) : resolve();
            });
        });
    }

    /**
     * Get full key
     * 
     * @param keyVal
     * @returns {Promise}
     */
    get_keys (keyVal) {
        var self = this;
        
        return new Promise((resolve) => {
            resolve([self.key + keyVal]);
        });
    }
}

module.exports = OneToManyKey;