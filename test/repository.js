'use strict';

var assert = require('assert');
var redis = require('@aantonov/redis-mock');

var Repository = require('../src/repository');
var test_model = require('./mocks/test-model');

describe('Repository', function () {

    describe('#get', function () {
        it('Should return model object from db', function (done) {
            var test_schema = {
                id: 1,
                name: 'test_schema'
            };

            redis.store[test_model.key + test_schema.id] = JSON.stringify(test_schema);

            var repository = new Repository(test_model, redis);

            repository.get(test_schema.id).then(function(test_model) {
                assert.equal(test_model.id, test_schema.id);
                assert.equal(test_model.name, test_schema.name);

                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe('#fetch_by', function () {
        it('Should return models from db by index', function (done) {
            redis.store = [];
            
            var test_schema = {
                id: 1,
                company_id: 1,
                name: 'test_schema'
            };
            
            var test_schema_2 = {
                id: 2, 
                company_id: 1,
                name: 'test_schema_2'
            };
            
            redis.store['testmodel:info:' + test_schema.id] = JSON.stringify(test_schema);

            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            
            redis.store['company:company_models:' + test_schema.company_id] = [test_schema.id, test_schema_2.id];
            
            var repository = new Repository(test_model, redis);
            
            repository.fetch_by('company_id', test_schema.company_id)
                .then(function (models) {
                    assert.ok(models instanceof Array);
                    assert.equal(models.length, 2);
                    
                    assert.equal(models[0].id, test_schema.id);
                    assert.equal(models[1].id, test_schema_2.id);
                    
                    done();
                }).catch(done);
        });
    });
    
    describe('#save', function () {
        
        it('Should save model into db', function (done) {
            redis.store = [];

            var test_schema = {
                company_id: 1,
                name: 'test_schema'
            };

            var repository = new Repository(test_model, redis);

            repository.save(test_schema).then(function (id) {
                assert.equal(id, 1);

                assert.equal(JSON.parse(redis.store[test_model.key + id]).id, 1);

                Object.keys(test_model.indexes).forEach(function (item, arr) {
                    assert.equal(redis.store[item + test_model[arr[item]]], test_model.id);
                });

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

            var repository = new Repository(test_model, redis);

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

            var test_schema = {
                id: test_schema_id,
                company_id: 1,
                name: 'test_schema'
            };

            var updated_test_schema = {
                id: test_schema_id,
                company_id: 1,
                name: 'updated_test_schema'
            };

            redis.store['testmodel:info:' + test_schema_id] = JSON.stringify(test_schema);

            var repository = new Repository(test_model, redis);

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

            var test_schema = {
                id: 1,
                company_id: 1,
                name: 'test_schema'
            };

            var repository = new Repository(test_model, redis);

            repository.save(test_schema).then(function () {
                done(new Error('Must be done with error'));
            }).catch(function (err) {
                assert.equal(err.message, 'Updating object not exist');

                done();
            });
        });
        
        it('Should return index error because index field in model not exist', function (done) {
            redis.store = [];
            
            var repository = new Repository(test_model, redis);
            
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
            
            var test_schema = {
                id: 1,
                name: 'test_schema',
                company_id: 1
            };
            
            redis.store['testmodel:info:' + test_schema.id] = JSON.stringify(test_schema);
            redis.store['company:company_models:' + test_schema.company_id] = [test_schema.company_id];
            
            var repository = new Repository(test_model, redis);
            
            repository.delete(test_schema.id).then(() => {
                assert.equal(redis.store['testmodel:info:' + test_schema.id], undefined);
                assert.equal(redis.store['company:company_models:' + test_schema.company_id].length, 0);
                
                done();
            }).catch(done);
        });
    })
});