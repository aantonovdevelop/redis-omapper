'use strict';

var assert = require('assert');

var test_model = require('./mocks/test-model');
var model_factory = require('../src/model-factory');

describe('Model', function () {
    describe('#check_fields', function () {

        it('Should check model fields and return true', function (done) {
            var test = model_factory({id: 1, name: 'test', company_id: 1, user_id: 1, options_ids: [1]}, test_model);

            assert.equal(test.check_fields(), true);

            done();
        });

        it('Should check model fields and return false', function (done) {
            var test = model_factory({id: 1, company_id: 1, failed_name: 'test'}, test_model);

            assert.equal(test.check_fields(), false);

            done();
        });

        it('Should check model fields and return false', function (done) {
            var test = model_factory({id: 1}, test_model);

            assert.equal(test.check_fields(), false);

            done();
        });
        
        it('Should check model fields and return false', function (done) {
            var test = model_factory({id: 1, name: 'test_model'}, test_model);
            
            assert.equal(test.check_fields(), false);
            
            done();
        });
    });

    describe('#to_object', function () {
        it('Should convert Model to Object', function () {
            var test = model_factory({id: 1, name: 'test_model', company_id: 2, options_ids: [1, 2, 3]}, test_model);

            var result = test.to_object();

            assert.equal(result.id, test.id);
            assert.equal(result.name, test.name);
            assert.equal(result.company_id, test.company_id);
        });
    });
});