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
        var self = this,
            full_key = self.key + keyVal,
            model_value = Number(modelVal);
        
        return new Promise ((resolve, reject) => {
            self.redis.set(full_key, model_value, (err) => {
                err ? reject(err) : resolve();
            });
        });
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
            self.redis.get(full_key, (err, res) => {
                err ? reject(err) : resolve([res]);
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
            self.redis.del(full_key, (err) => {
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

module.exports = OneToOneKey;