'use strict';

var assert = require('assert');

var Model = require('../src/model');

describe('Model', function () {
    describe('#checkFields', function () {

        function TestModel(scheme) {
            this.fields = ['id', 'name'];

            this.scheme = scheme;
        }

        TestModel.prototype = new Model();

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