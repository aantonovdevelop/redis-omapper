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

        function get_models_ids(index, id) {
            return new Promise((resolve, reject) => {
                if (index.type === 'one_to_one') {
                    get_one_to_one_ids(index.key + id).then(resolve).catch(reject);
                } else if (index.type === 'one_to_many') {
                    get_one_to_many_ids(index.key + id).then(resolve).catch(reject);
                }
            });
            
            function get_one_to_one_ids(key) {
                return new Promise((resolve, reject) => {
                    redis.get(key, (err, id) => {
                        err ? reject(err) : resolve([id]);
                    });
                });
            }
            
            function get_one_to_many_ids(key) {
                return new Promise((resolve, reject) => {
                    redis.smembers(key, (err, ids) => {
                        err ? reject(err) : resolve(ids);
                    });
                });
            }
        }
        
        function get_models_by_ids(ids) {
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
                
                if (index.type === 'one_to_one') {
                    update_one_to_one_index(index, indexes, callback)
                } else if (index.type === 'one_to_many') {
                    update_one_to_many_index(index, indexes, callback)
                } else {
                    callback(new Error('Wrong index type'));
                }
                
                function update_one_to_one_index(index, indexes, callback) {
                    redis.sadd(indexes[index].key + model.schema[index], model.schema.id, function (err) {
                        callback(err);
                    });
                }
                
                function update_one_to_many_index(index, indexes, callback) {
                    redis.set(indexes[index].key + model.schema[index], model.schema.id, function (err) {
                        callback(err);
                    })
                }
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
                    
                    if (index.type === 'one_to_one') {
                        delete_one_to_one_index(index.key + index_value, callback);
                    } else if (index.type === 'one_to_many') {
                        delete_one_to_many_index(index.key + index_value, model.id, callback);
                    } else {
                        callback(new Error('Wrong index type'));
                    }
                    
                    function delete_one_to_one_index(key, callback) {
                        redis.del(key, callback);
                    }
                    
                    function delete_one_to_many_index(key, id, callback) {
                        redis.srem(key, id, callback);
                    }
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