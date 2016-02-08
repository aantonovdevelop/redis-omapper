'use strict';

var redis = require('./mocks/redis');
var Repository = require('../src/repository');

describe('Repository', function () {
    describe('#get', function () {
        it('Should return model object from db', function (done) {
            var repository = new Repository(model, redis);

            repository.get()
        });
    });

    describe('#set', function () {
        it('Should save model into db', function (done) {

        });
    });
});