'use strict';

var assert = require('assert');

var TestModel = require('./mocks/test-model');

describe('Model', function () {
    describe('#check_fields', function () {

        it('Should check model fields and return true', function (done) {
            var test = new TestModel({id: 1, name: 'test', company_id: 1});

            assert.equal(test.check_fields(), true);

            done();
        });

        it('Should check model fields and return false', function (done) {
            var test = new TestModel({id: 1, company_id: 1, failed_name: 'test'});

            assert.equal(test.check_fields(), false);

            done();
        });

        it('Should check model fields and return false', function (done) {
            var test = new TestModel({id: 1});

            assert.equal(test.check_fields(), false);

            done();
        });
    });
});