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

            redis.store[test_model.key + 'info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store['testmodel:model_options:' + test_schema_1.id] = [1, 2, 3];

            var repository = new Repository(test_model, worker, redis);

            repository.get(test_schema_1.id).then(function(test_model) {
                assert.equal(test_model.id, test_schema_1.id);
                assert.equal(test_model.name, test_schema_1.name);
                
                assert.ok(test_model.options_ids instanceof Array);

                done();
            }).catch(function (err) {
                done(err);
            });
        });
    });
    
    describe('#get_all', function () {
        it('Should return all models', function (done) {
            redis.store[test_model.key + 'info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store[test_model.key + 'info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.get_all().then((models) => {
                assert.ok(models instanceof Array);
                assert.equal(models.length, 2);
                
                done();
            }).catch(done);
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
            redis.store['testmodel:model_options:' + test_schema_1.id] = [1, 2, 3];

            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            redis.store['testmodel:model_options:' + test_schema_2.id] = [1, 2, 3];
            
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
        
        it('Should return model from db by one to one index', function (done) {
            redis.store = [];
            
            redis.store['testmodel:info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store['user:user_model:' + test_schema_1.user_id] = test_schema_1.id;
            redis.store['testmodel:model_options:' + test_schema_1.id] = [];
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.fetch_by('user_id', test_schema_1.user_id)
                .then(function (model) {
                    assert.ok(model);
                    assert.equal(model[0].id, test_schema_1.id);
                    
                    done();
                }).catch(done);
        });
        
        it('Should return models by many to one index', function (done) {
            redis.store = [];
            
            redis.store['testmodel:info:' + test_schema_1.id] = JSON.stringify(test_schema_1);
            redis.store['testmodel:model_options:' + test_schema_1.id] = [1, 2, 3];
            
            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            redis.store['testmodel:model_options:' + test_schema_2.id] = [1, 2, 3];
            
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
            redis.store['testmodel:model_options:' + test_schema_1.id] = [1, 2, 3];
            
            redis.store['testmodel:info:' + test_schema_2.id] = JSON.stringify(test_schema_2);
            redis.store['testmodel:model_options:' + test_schema_2.id] = [1, 2, 3];
            
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

                assert.equal(JSON.parse(redis.store[test_model.key + 'info:' + id]).id, 1);

                assert.equal(redis.store['company:company_models:' + test_schema_1.company_id][0], id);
                
                assert.equal(redis.store['user:user_model:' + test_schema_1.user_id], id);
                
                assert.equal(redis.store['option:option_models:1'][0], id);
                assert.equal(redis.store['option:option_models:2'][0], id);
                assert.equal(redis.store['option:option_models:3'][0], id);
                
                assert.equal(redis.store['testmodel:model_options:' + id][0], 1);
                assert.equal(redis.store['testmodel:model_options:' + id][1], 2);
                assert.equal(redis.store['testmodel:model_options:' + id][2], 3);
                
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

            var updated_test_schema = JSON.parse(JSON.stringify(test_schema_1));
            
            updated_test_schema.name = 'updated_name';
            updated_test_schema.options_ids = [1];

            redis.store['testmodel:info:' + test_schema_id] = JSON.stringify(test_schema_1);
            redis.store['testmodel:model_options:' + test_schema_id] = test_schema_1.options_ids;

            redis.store['option:option_models:1'] = [1];
            redis.store['option:option_models:2'] = [1];
            redis.store['option:option_models:3'] = [1];

            var repository = new Repository(test_model, worker, redis);

            repository.save(updated_test_schema).then(function (id) {
                assert.equal(id, test_schema_id);

                assert.equal(JSON.parse(redis.store['testmodel:info:' + test_schema_id]).id, test_schema_id);
                assert.equal(JSON.parse(redis.store['testmodel:info:' + test_schema_id]).name, updated_test_schema.name);

                assert.equal(redis.store['option:option_models:1'][0], 1);
                assert.equal(redis.store['option:option_models:2'].length, 0);
                assert.equal(redis.store['option:option_models:3'].length, 0);

                assert.equal(redis.store['testmodel:model_options:' + test_schema_id].length, 1);

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
            
            redis.store['option:option_models:' + 1] = [test_schema_1.id];
            redis.store['option:option_models:' + 2] = [test_schema_1.id];
            redis.store['option:option_models:' + 3] = [test_schema_1.id];
            
           redis.store['testmodel:model_options:' + test_schema_1.id] = test_schema_1.options_ids;
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.delete(test_schema_1.id).then(() => {
                assert.equal(redis.store['testmodel:info:' + test_schema_1.id], undefined);
                assert.equal(redis.store['company:company_models:' + test_schema_1.company_id].length, 0);
                assert.equal(redis.store['user:user_model:' + test_schema_1.user_id], undefined);

                assert.equal(redis.store['option:option_models:' + 1].length, 0);
                assert.equal(redis.store['option:option_models:' + 2].length, 0);
                assert.equal(redis.store['option:option_models:' + 3].length, 0);
                
                assert.equal(redis.store['testmodel:model_options' + test_schema_1.id], undefined);
                
                done();
            }).catch(done);
        });
    });

    describe('#update_field', function () {
        it('Should update field of model in db', function (done) {
            var repository = new Repository(test_model, worker, redis);

            redis.store = [];
            redis.store['testmodel:info:1'] = JSON.stringify(test_schema_1);

            repository.update_field(1, 'name', 'updated_name').then(() => {
                assert.equal(JSON.parse(redis.store['testmodel:info:1']).name, 'updated_name');

                done();
            }).catch(done);
        });

        it('Should update one-to-one foreign key of model in db', function (done) {
            redis.store = [];

            var repository = new Repository(test_model, worker, redis);

            redis.store['testmodel:info:1'] = JSON.stringify(test_schema_1);

            repository.update_field(1, 'user_id', 4).then(() => {
                assert.equal(redis.store['user:user_model:4'], 1);

                done();
            }).catch(done);
        });
        
        it('Should update one-to-many foreign key of model in db', function (done) {
            redis.store = [];
            
            var repository = new Repository(test_model, worker, redis);
            
            repository.save(test_schema_3).then(id => {
                assert.equal(redis.store['company:company_models:' + test_schema_3.company_id][0], id);
                
                return repository.update_field(1, 'company_id', 2).then(() => {
                    assert.equal(redis.store['company:company_models:' + test_schema_3.company_id].length, 0);
                    
                    assert.equal(redis.store['company:company_models:2'].length, 1);
                    assert.equal(redis.store['company:company_models:2'][0], id);
                    
                    return Promise.resolve();
                });
            }).then(done).catch(done);
        });
    });
});