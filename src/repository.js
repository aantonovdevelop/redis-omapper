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


        function get_id(callback) {
            if (!model.schema.id) {
                redis.incr(self.key + ':next_id', function (err, id) {
                    model.schema.id = id;

                    callback(err, id);
                });
            } else {
                callback(null, model.schema.id);
            }
        }

        function save_or_update(id, schema, callback) {
            redis.set(self.key + id, JSON.stringify(schema), function (err) {
                callback(err, id);
            });
        }

        return new Promise(function (resolve, reject) {

            if (!model.checkFields()) reject(new Error('Wrong schema'));

            get_id(function (err, id) {
                if (err) reject(err);

                save_or_update(id, model.schema, function (err, id) {
                    if (err) reject(err);

                    resolve(id);
                });
            });
        });
    };

    this.delete = function (id) {
        var self = this;

        return new Promise(function (resolve, reject) {
            redis.rem(self.key + id, function (err) {
                if (err) reject(err);

                resolve();
            });
        });
    }
}

module.exports = Repository;