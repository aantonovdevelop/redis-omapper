"use strict";

var assert = require('assert'),
    util = require('util');

describe('Integration', function () {
    var models = undefined,
        options = undefined,
        redis = undefined;
    
    describe('#initialization', function () {
        it('Should initialize repository', function () {
            let test_model = require('./mocks/test-model'),
                option_model = require('./mocks/option-model');

            let redis_mock = require('@aantonov/redis-mock');

            let redis_handler = {
                get: function (target, key) {
                    if (typeof target[key] === 'function') {
                        return function () {
                            let args = Array.prototype.slice.call(arguments, 0);
                            args = typeof args[args.length - 1] == "function" ? args.slice(0, args.length - 1) : args;

                            let redis_key = args[0];

                            console.log("previously", this.store[redis_key]);

                            console.log(Date.now(), key, args.join(", "));

                            let fun_result = target[key].apply(this, arguments);

                            console.log("result", this.store[redis_key]);

                            return fun_result;
                        }
                    }

                    return target[key];
                }
            };

            redis = new Proxy(redis_mock, redis_handler);

            models = require('../index').create_string_repository(test_model, redis);
            options = require('../index').create_hash_repository(option_model, redis);

            assert.ok(models);
        });
    });
    
    describe('#get_all', function () {
        it('Should save two models into repository and get it', function (done) {
            let model_mock = {
                company_id: 1,
                user_id: 1,
                options_ids: [1],
                name: 'model'
            };
            
            models.save(model_mock)
                .then(models.save.bind(models, model_mock))
                .then(models.get_all.bind(models))
                .then(models => {
                    assert.equal(models[0].id, 1);
                    assert.equal(models[1].id, 2);
                    
                    done();
            }).catch(err => {
                done(err);
            });
        });
    });

    describe('#fetch_by', function () {
        it('Should fetch all elements by key', function (done) {
            redis.store = [];

            let model_mock = {
                company_id: 1,
                user_id: 1,
                options_ids: [1, 2, 3],
                name: 'model'
            };

            let option_mock = {
                company_id: 1,
                name: 'option',
                models_ids: []
            };

            Promise.all([
                options.save(option_mock),
                options.save(option_mock),
                options.save(option_mock),

                models.save(model_mock),
                models.save(model_mock)
            ])
                .then(() => models.fetch_by("company_id", 1))
                .then(models => {
                    console.log(util.inspect(redis.store, false));

                    assert.equal(models[0].id, 1);
                    assert.equal(models[1].id, 2);

                    assert.equal(models[0].options_ids.length, 3);
                    assert.equal(models[1].options_ids.length, 3);
                })
                .then(() => {
                    let updated_option_1 = Object.assign({}, option_mock),
                        updated_option_2 = Object.assign({}, option_mock),
                        updated_option_3 = Object.assign({}, option_mock);

                    updated_option_1.id = 1;
                    updated_option_2.id = 2;
                    updated_option_3.id = 3;

                    updated_option_1.models_ids = [2];
                    updated_option_2.models_ids = [2];
                    updated_option_3.models_ids = [2];

                    return Promise.all([
                        options.save(updated_option_1),
                        options.save(updated_option_2),
                        options.save(updated_option_3)
                    ]);
                })
                .then(() => {
                    console.log(util.inspect(redis.store, false));

                    return options.fetch_by("company_id", 1)
                })
                .then(options => {

                    console.log(util.inspect(redis.store, false));

                    assert.equal(options[0].id, 1);
                    assert.equal(options[1].id, 2);
                    assert.equal(options[2].id, 3);

                    assert.equal(options[0].models_ids.length, 1);
                    assert.equal(options[1].models_ids.length, 1);
                    assert.equal(options[2].models_ids.length, 1);
                })
                .then(() => {
                    console.log(util.inspect(redis.store, false));

                    return models.fetch_by("company_id", 1)
                })
                .then(models => {
                    assert.equal(models[0].id, 1);
                    assert.equal(models[1].id, 2);

                    assert.equal(models[0].options_ids.length, 0);
                    assert.equal(models[1].options_ids.length, 3);

                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('#foreign_keys', function () {
        it('Should save new model and update one to one foreign keys after model update', function (done) {
            redis.store = [];

            let model_mock = {
                company_id: 1,
                user_id: 1,
                options_ids: [],
                name: 'model'
            };

            models.save(model_mock)
                .then(id => {
                    model_mock.id = id;
                    model_mock.user_id = 2;
                })
                .then(() => models.save(model_mock))
                .then(id => {
                    assert.equal(model_mock.id, id);
                    assert.equal(redis.store['user:user_model:1'], undefined);
                    assert.equal(redis.store['user:user_model:2'], 1);

                    done();
                })
                .catch(err => done(err));
        });

        it('Should save new model and update one to many foreign keys after model update', function (done) {
            redis.store = [];

            let model_mock = {
                company_id: 1,
                user_id: 1,
                options_ids: [],
                name: 'model'
            };

            models.save(model_mock)
                .then(id => {
                    model_mock.id = id;
                    model_mock.company_id = 2;
                })
                .then(() => models.save(model_mock))
                .then(id => {
                    assert.equal(model_mock.id, id);
                    assert.equal(redis.store['company:company_models:1'].length, 0);
                    assert.equal(redis.store['company:company_models:2'].length, 1);
                    assert.equal(redis.store['company:company_models:2'][0], id);

                    done();
                })
                .catch(err => done(err));
        });

        it('Should save new model and update many to many foreign keys after model update', function (done) {
            redis.store = [];

            let model_mock = {
                company_id: 1,
                user_id: 1,
                options_ids: [1, 2],
                name: 'model'
            };

            models.save(model_mock)
                .then(id => {
                    model_mock.id = id;
                    model_mock.options_ids = [3, 4];
                })
                .then(() => models.save(model_mock))
                .then(id => {
                    assert.equal(model_mock.id, id);
                    assert.equal(redis.store['option:option_models:1'].length, 0);
                    assert.equal(redis.store['option:option_models:2'].length, 0);
                    assert.equal(redis.store['option:option_models:3'].length, 1);
                    assert.equal(redis.store['option:option_models:4'].length, 1);

                    assert.equal(redis.store['testmodel:model_options:' + id].length, 2);

                    assert.equal(redis.store['testmodel:model_options:' + id][0], 3);
                    assert.equal(redis.store['testmodel:model_options:' + id][1], 4);

                    done();
                })
                .catch(err => done(err));
        })
    });
});