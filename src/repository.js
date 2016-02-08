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
            if (!model.checkFields()) reject(new Error('Wrong schema'));

            get_id(function (err, id) {
                if (err) reject(err);

                if (isUpdate) {
                    check_updating_object_existing(id, function (err, isExist) {
                        if (!isExist) reject(new Error('Updating object not exist'));

                        save_or_update(id, model.schema, return_result)
                    });
                } else {
                    save_or_update(id, model.schema, return_result);
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