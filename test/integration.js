"use strict";

var assert = require('assert');

describe('Integration', function () {
    var models = undefined;
    
    describe('#initialization', function () {
        it('Should initialize repository', function () {
            let test_model = require('./mocks/test-model'),
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
                options_ids: [],
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
});