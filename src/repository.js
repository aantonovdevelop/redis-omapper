var async = require('async');

function Repository (model, redis) {

    this.key = model.key || (model.name.toLowerCase() + ':info:');

    this.get = function (id) {
        var self = this;

        return new Promise(function (resolve, reject) {
            redis.get(self.key + id, function (err, schema) {
                if (err) reject(err);

                var result_model = new model(JSON.parse(schema));

                resolve(result_model);
            });
        });
    };

    this.save = function (model) {
        var self = this;
        var isUpdate = false;

        return new Promise(function (resolve, reject) {
            get_id(function (err, id) {
                if (err) reject(err);

                if (!model.checkFields()) reject(new Error('Wrong schema'));

                if (isUpdate) {
                    check_updating_object_existing(id, function (err, isExist) {
                        if (!isExist) return reject(new Error('Updating object not exist'));

                        save_or_update(id, model.schema, function (err) {
                            if (err) return reject(err);

                            save_indexes(model.indexes, function (err) {
                                return_result(err, id);
                            });
                        })
                    });
                } else {
                    save_or_update(id, model.schema, function (err, id){
                        if (err) return reject(err);

                        save_indexes(model.indexes, function (err) {
                            return_result(err, id);
                        });
                    });
                }
            });

            function return_result(err, id) {
                if (err) reject(err);

                resolve(id);
            }
        });

        function get_id(callback) {
            if (!model.schema.id) {
                redis.incr(self.key + ':next_id', function (err, id) {
                    model.schema.id = id;

                    callback(err, id);
                });
            } else {
                isUpdate = true;

                callback(null, model.schema.id);
            }
        }

        function save_or_update(id, schema, callback) {
            redis.set(self.key + id, JSON.stringify(schema), function (err) {
                callback(err, id);
            });
        }

        function save_indexes(indexes, callback) {

            async.eachSeries(indexes, update_index, function (err) {
                callback(err, null);
            });

            function update_index(index, callback) {
                redis.sadd(index.key + model.schema[index.field], model.schema.id, function (err) {
                    callback(err);
                });
            }
        }

        function check_updating_object_existing(id, callback) {
            redis.exists(self.key + id, function (err, isExist) {
                callback(err, isExist);
            });
        }
    };


    this.delete = function (id) {
        var self = this;

        return new Promise(function (resolve, reject) {
            redis.del(self.key + id, function (err) {
                if (err) reject(err);

                resolve();
            });
        });
    }
}

module.exports = Repository;