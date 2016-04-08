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
    
    describe('#get_values', function () {
        it('Should return values by key', function (done) {
            redis.store = [];
        
            redis.store['somekey:1'] = [1, 2];
            
            var OneToManyKey = require('../src/foreign-keys/one-to-many');
            var index = new OneToManyKey('somekey:', redis);
            
            index.get_values(1)
                .then((res) => {
                    assert.equal(res.length, 2);
                    
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
    
    describe('#get_keys', function () {
        it('Should return full key', function (done) {
            var OneToManyKey = require('../src/foreign-keys/one-to-many');
            var index = new OneToManyKey('somekey:', redis);
            
            index.get_keys(1).then((fullKey) => {
                assert.ok(fullKey instanceof Array);
                assert.equal(fullKey, 'somekey:1');
                
                done();
            }).catch(done);
        });
    });
});