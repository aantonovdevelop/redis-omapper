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
        var self = this;
        var full_key = self.key + keyVal;
        
        return new Promise((resolve, reject) => {
            self.redis.sadd(full_key, modelVal, (err) => {
                err ? reject(err) : resolve();
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
        var self = this;
        var full_key = self.key + keyVal;
        
        return new Promise((resolve, reject) => {
            self.redis.srem(full_key, modelVal, (err) => {
                err ? reject(err) : resolve();
            });
        });
    }
}

module.exports = OneToManyKey;