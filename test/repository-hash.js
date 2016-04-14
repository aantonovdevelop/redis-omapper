"use strict";

var assert = require('assert');

var Repository = require('../src/repository');
var redis = require('@aantonov/redis-mock');
var worker = require('../src/redis-model-workers/hash-worker')(redis);

var test_model = require('./mocks/test-model');

var test_schema_1 = {
    id: 1,
    company_id: 1,
    user_id: 1,
    options_ids: [1, 2, 3],

    name: 'test_model_1'
};

var test_schema_2 = {
    id: 2,
    company_id: 1,
    user_id: 1,
    options_ids: [1, 2, 3],

    name: 'test_model_2'
};

var test_schema_3 = {
    company_id: 1,
    user_id: 1,
    options_ids: [1, 2, 3],

    name: 'test_model_3'
};

describe('Repository', function () {
    describe('#get', function () {
        it('Should return model', function (done) {
            var repository = new Repository(test_model, worker, redis);

            redis.store = [];

            redis.store['testmodel:info:1'] = test_schema_1;

            repository.get(test_schema_1.id).then((model) => {
                assert.equal(model.id, test_schema_1.id);
                
                done();
            }).catch(done);
        });
    });
    
    describe('#get_many', function () {
        it('Should get many models', function (done) {
            var repository = new Repository(test_model, worker, redis);

            redis.store = [];
            
            redis.store['testmodel:info:1'] = test_schema_1;
            redis.store['testmodel:info:2'] = test_schema_2;
            
            repository.get_many([1, 2]).then((models) => {
                assert.ok(models instanceof Array);
                assert.equal(models.length, 2);
                
                done();
            }).catch(done);
        });
    });
    
    describe('#save', function () {
        it('Should save model in db', function (done) {
            var repository = new Repository(test_model, worker, redis);
            
            redis.store = [];
            
            repository.save(test_schema_3).then((id) => {
                assert.ok(id);
                
                redis.store['testmodel:info:' + id].id = id;
                
                done();
            }).catch(done);
        });
    });
    
    describe('#update_field', function () {
        it('Should update field of model in db', function (done) {
            var repository = new Repository(test_model, worker, redis);
            
            redis.store = [];
            redis.store['testmodel:info:1'] = test_schema_1;
            
            repository.update_field(1, 'name', 'updated_name').then(() => {
                assert.equal(redis.store['testmodel:info:1'].name, 'updated_name');
                
                done();
            }).catch(done);
        });
    });
});