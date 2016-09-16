"use strict";

var assert = require('assert');

describe('Integration', function () {
    var models = undefined,
        redis = undefined;
    
    describe('#initialization', function () {
        it('Should initialize repository', function () {
            let test_model = require('./mocks/test-model');

            redis = require('@aantonov/redis-mock');
            models = require('../index').create_string_repository(test_model, redis);
            
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