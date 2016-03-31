var async = require('async');

var model_factory = require('./model-factory');

/**
 * Create Repository instance
 * 
 * @param {Object} model_schema Model schema
 * @param {Object} redis Redis db client
 * @constructor
 */
function Repository (model_schema, redis) {

    this.model_schema = model_schema;
    
    /**
     * Get object from redis
     * 
     * @param {Number} id Object ID
     * @returns {Promise}
     */
    this.get = function (id) {
        var self = this;

        return new Promise(function (resolve, reject) {
            redis.get(self.model_schema.key + id, function (err, schema) {
                if (err) reject(err);

                var result_model = model_factory(JSON.parse(schema), model_schema);

                resolve(result_model);
            });
        });
    };

    /**
     * Get all object by index
     *
     * @param {String} index Index name
     * @param {Number} id Index value
     * 
     * @returns {Promise}
     */
    this.fetch_by = function (index, id) {
        var self = this;

        return new Promise((resolve, reject) => {
            get_models_ids(self.model_schema.indexes[index], id)
                .then(get_models_by_ids).then(resolve).catch(reject);
        });

        function get_models_ids(key, id) {
            return new Promise((resolve, reject) => {
                redis.smembers(key + id, (err, ids) => {
                    err ? reject(err) : resolve(ids);
                });
            });
        }
        
        function get_models_by_ids(ids) {
            var result = [];
            
            return new Promise((resolve, reject) => {
                async.eachSeries(ids, (id, callback) => {
                    self.get(id).then((model) => {
                        result.push(model);
                        
                        callback();
                        
                    }).catch(callback);
                }, (err) => {
                    err ? reject(err) : resolve(result);
                });
            });
        }
    };
    
    /**
     * Save or update model into redis
     * 
     * @param {Object|Model} model Model fields object or model
     * 
     * @returns {Promise}
     */
    this.save = function (model) {
        var self = this;
        var isUpdate = false;

        if (model.constructor.name !== 'Model') {
            model = model_factory(model, this.model_schema);
        }

        return new Promise(function (resolve, reject) {
            if (!model.check_fields()) return reject(new Error('Wrong schema'));

            get_id().then(function (id) {

                if (isUpdate) {
                    check_updating_object_existing(id).then(function (isExist) {
                        if (!isExist) return reject(new Error('Updating object not exist'));

                        save_model(id, resolve, reject);

                    }).catch(reject);
                } else {
                    save_model(id, resolve, reject);
                }
            }).catch(reject);
        });

        function get_id() {
            return new Promise(function (resolve, reject) {
                if (!model.id) {
                    redis.incr(self.model_schema.key + ':next_id', function (err, id) {
                        if (err) return reject(err);

                        model.id = id;

                        resolve(id);
                    });
                } else {
                    isUpdate = true;

                    resolve(model.id);
                }
            });
        }

        function save_model(id, resolve, reject) {
            save_or_update(id, model.to_object()).then(function () {
                save_indexes(model.indexes).then(function () {
                    resolve(id)
                }).catch(reject);
            }).catch(reject);
        }

        function save_or_update(id, schema) {
            return new Promise(function (resolve, reject) {
                redis.set(self.model_schema.key + id, JSON.stringify(schema), function (err) {
                    if (err) return reject(err);

                    resolve(id);
                });
            });
        }

        function save_indexes(indexes) {

            return new Promise(function (resolve, reject) {
                async.eachSeries(Object.keys(indexes || []), update_index, function (err) {
                    if (err) return reject(err);

                    resolve();
                });
            });

            function update_index(index, indexes, callback) {
                redis.sadd(indexes[index] + model.schema[index], model.schema.id, function (err) {
                    callback(err);
                });
            }
        }

        function check_updating_object_existing(id) {
            return new Promise(function (resolve, reject) {
                redis.exists(self.model_schema.key + id, function (err, isExist) {
                    if (err) return reject(err);

                    resolve(isExist);
                });
            });

        }
    };

    /**
     * Delete object from redis
     * 
     * @param {Number} id Deleting object ID
     * @returns {Promise}
     */
    this.delete = function (id) {
        var self = this;

        return new Promise(function (resolve, reject) {
            redis.del(self.model_schema.key + id, function (err) {
                if (err) reject(err);

                resolve();
            });
        });
    }
}

module.exports = Repository;