'use strict';

var assert = require('assert');
var redis = require('@aantonov/redis-mock');

var Repository = require('../src/repository');
var test_model = require('./mocks/test-model');
var worker = require('../src/redis-model-workers/string-worker')(redis);

describe('Repository', function () {
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

    describe('#get', function () {
        it('Should return model object from db', function (done) {

            redis.store[test_model.key + test_schema_1.id] = JSON.stringify(test_schema_1);

            var repository = new Repository(test_model, worker, redis);

            repository.get(test_schema_1.id).then(function(test_model) {
                assert.equal(test_model.id, test_schema_1.id);
                assert.equal(test_model.name, test_schema_1.name);

                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    
    describe('#get_many', function () {
        it('Should return models by keys', function (done) {
            redis.store[test_model.key + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store[test_model.key + test_schema_2.id] = JSON.stringify(test_schema_2);
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.get_many([test_schema_1.id, test_schema_2.id]).then((models) => {
                
                assert.ok(models instanceof Array);
                
                assert.equal(models.length, 2);
                assert.equal(models[0].id, test_schema_1.id);
                assert.equal(models[1].id, test_schema_2.id);
                
                done();
                
            }).catch(done);
        });
    });

    describe('#fetch_by', function () {
        it('Should return models from db by index', function (done) {
            redis.store = [];
          
            redis.store['testmodel:info:' + test_schema_1.id] = JSON.stringify(test_schema_1);

            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            
            redis.store['company:company_models:' + test_schema_1.company_id] = [test_schema_1.id, test_schema_2.id];
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.fetch_by('company_id', test_schema_1.company_id)
                .then(function (models) {
                    assert.ok(models instanceof Array);
                    assert.equal(models.length, 2);
                    
                    assert.equal(models[0].id, test_schema_1.id);
                    assert.equal(models[1].id, test_schema_2.id);
                    
                    done();
                }).catch(done);
        });
        
        it('Should return models by many to one index', function (done) {
            redis.store = [];
            
            redis.store['testmodel:info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            
            redis.store['option:option_models:1'] = [test_schema_1.id, test_schema_2.id];
            redis.store['option:option_models:2'] = [test_schema_2.id];
            redis.store['option:option_models:3'] = [test_schema_1.id];
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.fetch_by('options_ids', [1, 2]).then((models) => {
                assert.ok(models instanceof Array);
                
                assert.equal(models.length, 1);
                assert.equal(models[0].id, 2);
                
                done();
                
            }).catch(done);
        });
    });
    
    describe('#fetch_by_many', function () {
        it('Should returns models by few indexes', function (done) {
            redis.store = [];
            
            redis.store['testmodel:info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            
            redis.store['company:company_models:1'] = [test_schema_2.id];
            
            redis.store['option:option_models:1'] = [test_schema_1.id, test_schema_2.id];
            redis.store['option:option_models:2'] = [test_schema_2.id];
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.fetch_by_many([{
                name: 'company_id',
                key_values: [1]
            }, {
                name: 'options_ids',
                key_values: [1, 2]
            }]).then((models) => {
                assert.ok(models instanceof Array);
                assert.equal(models.length, 1);
                assert.equal(models[0].id, 2);
                
                done();
            }).catch(done);
        });
    });
    
    describe('#save', function () {
        
        it('Should save model into db', function (done) {
            redis.store = [];

            var repository = new Repository(test_model, worker, redis);

            repository.save(test_schema_3).then(function (id) {
                assert.equal(id, 1);

                assert.equal(JSON.parse(redis.store[test_model.key + id]).id, 1);

                assert.equal(redis.store['company:company_models:' + test_schema_1.company_id][0], id);
                
                assert.equal(redis.store['user:user_model:' + test_schema_1.user_id], id);
                
                assert.equal(redis.store['option:option_models:1'][0], id);
                assert.equal(redis.store['option:option_models:2'][0], id);
                assert.equal(redis.store['option:option_models:3'][0], id);

                done();
            }).catch(function (err) {
                done(err);
            });
        });

        it('Should return error because schema is invalid', function (done) {
            redis.store = [];

            var test_schema = {
                wrong_field: 'test_schema'
            };

            var repository = new Repository(test_model, worker, redis);

            repository.save(test_model).then(function () {
                done(new Error('Must be done with error'));
            }).catch(function (err) {
                assert.equal(err.message, 'Wrong schema');

                done();
            });
        });

        it('Should update object in db', function (done) {
            redis.store = [];

            var test_schema_id = 1;

            var updated_test_schema = test_schema_1;
            updated_test_schema.name = 'updated_name';

            redis.store['testmodel:info:' + test_schema_id] = JSON.stringify(test_schema_1);

            var repository = new Repository(test_model, worker, redis);

            repository.save(updated_test_schema).then(function (id) {
                assert.equal(id, test_schema_id);

                assert.equal(JSON.parse(redis.store['testmodel:info:' + test_schema_id]).id, test_schema_id);
                assert.equal(JSON.parse(redis.store['testmodel:info:' + test_schema_id]).name, updated_test_schema.name);

                done();
            }).catch(function (err) {
                done(err);
            });
        });

        it('Should fail update because updated object not exist', function (done) {
            redis.store = [];

            var repository = new Repository(test_model, worker, redis);

            repository.save(test_schema_1).then(function () {
                done(new Error('Must be done with error'));
            }).catch(function (err) {
                assert.equal(err.message, 'Updating object not exist');

                done();
            });
        });
        
        it('Should return index error because index field in model not exist', function (done) {
            redis.store = [];
            
            var repository = new Repository(test_model, worker, redis);
            
            var test = {
                id: 1,
                name: 'TestModel'
            };
            
            repository.save(test).then().catch((err) => {
                assert.equal(err.message, 'Wrong schema');
                
                done();
            });
        });
        
    });

    describe('#delete', function () {
        
        it('Should delete object from db', function (done) {
            redis.store = [];
           
            redis.store['testmodel:info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store['company:company_models:' + test_schema_1.company_id] = [test_schema_1.company_id];
            redis.store['user:user_model:' + test_schema_1.user_id] = test_schema_1.id;
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.delete(test_schema_1.id).then(() => {
                assert.equal(redis.store['testmodel:info:' + test_schema_1.id], undefined);
                assert.equal(redis.store['company:company_models:' + test_schema_1.company_id].length, 0);
                assert.equal(redis.store['user:user_model:' + test_schema_1.user_id], undefined);
                
                done();
            }).catch(done);
        });
    });
});