'use strict';

var assert = require('assert');
var redis = require('./mocks/redis');

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

                test_model.indexes.forEach(function (item) {
                    assert.equal(redis.store[item.key + test_model[item.field]], test_model.id);
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
    });

    describe('#delete', function () {
        it('Should delete object from db', function (done) {
            redis.store = [];

            var test_schema = {
                id: 1,
                name: 'test_schema'
            };

            redis.store['testmodel:info:' + test_schema.id] = JSON.stringify(test_schema);

            var repository = new Repository(test_model, redis);

            repository.delete(test_schema.id).then(function () {
                assert.equal(redis.store['testmodel:info:' + test_schema.id], undefined);

                done();
            }).catch(function (err) {
                done(err);
            });
        });
    })
});