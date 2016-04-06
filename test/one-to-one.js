'use strict';

var redis = require('@aantonov/redis-mock');
var assert = require('assert');

describe('OneToOneKey', function () {
    describe('#update', function () {
        it('Should update key into db', function (done) {
            redis.store = [];
            
            var OneToOneKey = require('../src/foreign-keys/one-to-one');
            
            var index = new OneToOneKey('somekey:', redis);
            
            index.update_key(1, 2)
                .then(() => {
                    assert.equal(redis.store['somekey:1'], 2);
                    done();
            }).catch(done);
        });
    });
    
    describe('#delete', function () {
        it('Should delete key from db', function (done) {
            redis.store = [];
            redis.store['somekey:1'] = 2;
            
            var OneToOneKey = require('../src/foreign-keys/one-to-one');
            
            var index = new OneToOneKey('somekey:', redis);
            
            index.delete_key(1, 2)
                .then(() => {
                    assert.equal(redis.store['somekey:1'], undefined);
                    done()
                }).catch(done);
        });
    });
});