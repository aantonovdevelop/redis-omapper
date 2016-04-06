'use strict';

var ForeignKey = require('./foreign-key');

class OneToOneKey extends ForeignKey {

    /**
     * Create one to one key instance
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
        
        return new Promise ((resolve, reject) => {
            self.redis.set(full_key, modelVal, (err) => {
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
            self.redis.del(full_key, (err) => {
                err ? reject(err) : resolve();
            });
        });
    }
}

module.exports = OneToOneKey;