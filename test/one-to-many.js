'use strict';

var redis = require('@aantonov/redis-mock');
var assert = require('assert');

describe('OneToManyKey', function () {
    describe('#update_key', function () {
        it('Should update key in db', function (done) {
            redis.store = [];
            
            var OneToManyKey = require('../src/foreign-keys/one-to-many');
            var index = new OneToManyKey('somekey:', redis);
            
            index.update_key(1, 2)
                .then(() => {
                    assert.equal(redis.store['somekey:1'].length, 1);
                    
                    done();
                }).catch(done);
        });
    });
    
    describe('#delete_key', function () {
        it('Should delete key in db', function (done) {
            redis.store = [];
            
            redis.store['somekey:1'] = [2];
            
            var OneToManyKey = require('../src/foreign-keys/one-to-many');
            var index = new OneToManyKey('somekey:', redis);
            
            index.delete_key(1, 2)
                .then(() => {
                    assert.equal(redis.store['somekey:1'].length, 0);
                    
                    done();
                }).catch(done);
        });
    });
});