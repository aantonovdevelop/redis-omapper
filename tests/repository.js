'use strict';

var assert = require('assert');
var redis = require('./mocks/redis');

var Repository = require('../src/repository');
var TestModel = require('./mocks/test-model');

describe('Repository', function () {

    describe('#get', function () {
        it('Should return model object from db', function (done) {
            var test_schema = {
                id: 1,
                name: 'test_schema'
            };

            redis.store['testmodel:info:' + test_schema.id] = JSON.stringify(test_schema);

            var repository = new Repository(TestModel, redis);

            repository.get(test_schema.id).then(function(test_model) {
                assert.equal(test_model.schema.id, test_schema.id);
                assert.equal(test_model.schema.name, test_schema.name);

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
                name: 'test_schema'
            };

            var repository = new Repository(TestModel, redis);
            var test_model = new TestModel(test_schema);

            repository.save(test_model).then(function (id) {
                assert.equal(id, 1);

                assert.equal(JSON.parse(redis.store[TestModel.name.toLowerCase() + ':info:' + id]).id, 1);

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

            var repository = new Repository(TestModel, redis);
            var test_model = new TestModel(test_schema);

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
                name: 'test_schema'
            };

            var updated_test_schema = {
                id: test_schema_id,
                name: 'updated_test_schema'
            };

            redis.store['testmodel:info:' + test_schema_id] = JSON.stringify(test_schema);

            var repository = new Repository(TestModel, redis);

            repository.save(new TestModel(updated_test_schema)).then(function (id) {
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
                name: 'test_schema'
            };

            var repository = new Repository(TestModel, redis);

            repository.save(new TestModel(test_schema)).then(function () {
                done(new Error('Must be done with error'));
            }).catch(function (err) {
                assert.equal(err.message, 'Updating object not exist');

                done();
            });
        })
    });
});