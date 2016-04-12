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
    
    Object.keys(this.model_schema.indexes).forEach((indexname) => {
        this.model_schema.indexes[indexname].redis = redis;
    });
    
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
     * Get many object from redis
     * 
     * @param {Array} ids
     * 
     * @return {Promise<Array|Error>}
     */
    this.get_many = function (ids) {
        var self = this;
        
        return new Promise((resolve, reject) => {
            var keys = [];
            var models = [];
            
            ids.forEach((id) => {
                keys.push(self.model_schema.key + id);
            });

            redis.mget(keys, (err, values) => {
                if (err) return reject(err);
                
                values.forEach((value) => {
                    models.push(model_factory(JSON.parse(value), self.model_schema));
                });
                
                resolve(models);
            });
        });
    };

    /**
     * Get all object by index name
     *
     * @param {String} indexname Index name
     * @param {Number} id Index value
     * 
     * @returns {Promise}
     */
    this.fetch_by = function (indexname, id) {
        var self = this;

        return new Promise((resolve, reject) => {
            var index = self.model_schema.indexes[indexname];
            
            index.get_values(id)
                .then(get_models_by_ids.bind(self))
                .then(resolve).catch(reject);
        });

    };

    function get_models_by_ids(ids) {
        var self = this;
        var result = [];

        return new Promise((resolve, reject) => {
            async.eachSeries(ids, get_model, (err) => {
                err ? reject(err) : resolve(result);
            });
        });

        function get_model(id, callback) {
            self.get(id).then((model) => {
                result.push(model);

                callback()
            }).catch(callback);
        }
    }

    /**
     * Fetch models by many indexes
     * 
     * @param fetchindexes
     * @returns {Promise}
     */
    this.fetch_by_many = function (fetchindexes) {
        var self = this;
        var result_keys = [];
        var indexes = self.model_schema.indexes;

        return new Promise((resolve, reject) => {
            get_models_ids().then(get_models_by_ids.bind(self)).then(resolve).catch(reject);
        });
        
        function get_models_ids () {
            return new Promise((resolve, reject) => {
                async.eachSeries(fetchindexes, (fetchindex, callback) => {
                    indexes[fetchindex.name].get_keys(fetchindex.key_values)
                        .then((keys) => {
                            result_keys = result_keys.concat(keys);

                            callback();
                        }).catch(callback);
                }, (err) => {
                    if (err) return reject(err);

                    redis.sinter(result_keys, (err, ids) => {
                        err ? reject(err) : resolve(ids);
                    });
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
                    redis.incr(self.model_schema.key + 'next_id', function (err, id) {
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
                save_indexes(self.model_schema.indexes).then(function () {
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

            function update_index(index, callback) {
                indexes[index].update_key(model.schema[index], model.id)
                    .then(callback, callback);
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
            self.get(id)
                .then(delete_indexes)
                .then(delete_model)
                .then(resolve)
                .catch(reject);
        });
        
        function delete_indexes (model) {
            
            var indexes = self.model_schema.indexes;
            
            return new Promise((resolve, reject) => {
                async.eachSeries(Object.keys(indexes), delete_index, (err) => {
                    err ? reject(err) : resolve(model);
                });
                
                function delete_index(indexname, callback) {
                    
                    var index = indexes[indexname];
                    var index_value = model[indexname];
                    
                    index.delete_key(index_value, model.id).then(callback, callback);
                }
            });
        }
        
        function delete_model(model) {
            return new Promise((resolve, reject) => {
                redis.del(self.model_schema.key + model.id, function (err) {
                    err ? reject(err) : resolve();
                });
            });
        }
    }
}

module.exports = Repository;