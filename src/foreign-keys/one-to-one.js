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
     * @param isUpdate
     *
     * @returns {Promise}
     */
    update_key (keyVal, modelVal, isUpdate = true) {
        var full_key = this.key + keyVal,
            model_value = Number(modelVal);

        if (isUpdate) {
            return remove_previous.call(this)
                .then(() => save_key.call(this, full_key, model_value))
                .then(() => save_meta.call(this, keyVal));
        } else {
            return save_key.call(this, full_key, model_value)
                .then(() => save_meta.call(this, keyVal));
        }

        function remove_previous() {
            return get_meta.call(this)
                .then(val => {
                    this.redis.del(this.key + val, err => {
                        if (err) return Promise.reject(err);
                        else return Promise.resolve();
                    });
                });
        }

        function save_key (key, val) {
            return new Promise ((resolve, reject) => {
                this.redis.set(key, Number(val), (err) => {
                    err ? reject(err) : resolve();
                });
            });
        }

        function save_meta(val) {
            return new Promise((resolve, reject) => {
                this.redis.set(this.id, Number(val), (err) => {
                    err ? reject(err) : resolve();
                });
            });
        }

        function get_meta() {
            return new Promise((resolve, reject) => {
                this.redis.get(this.id, (err, val) => {
                    err ? reject(err) : resolve(val ? Number(val) : val);
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