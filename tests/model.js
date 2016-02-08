'use strict';

var assert = require('assert');

var TestModel = require('./mocks/test-model');

describe('Model', function () {
    describe('#checkFields', function () {

        it('Should check model fields and return true', function (done) {
            var test = new TestModel({id: 1, name: 'test'});

            assert.equal(test.checkFields(), true);

            done();
        });

        it('Should check model fields and return false', function (done) {
            var test = new TestModel({id: 1, failed_name: 'test'});

            assert.equal(test.checkFields(), false);

            done();
        });
    });
});