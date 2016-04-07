'use strict';

var redis = require('@aantonov/redis-mock');
var assert = require('assert');

describe('ManyToOneKey', function () {
    describe('#update_key', function () {
        it('Should save key into db', function (done) {
            redis.store = [];
            
            var ManyToOneKey = require('../src/foreign-keys/many-to-one');
            var index = new ManyToOneKey('somevalues:', redis);
            
            index.update_key([1, 2, 3], 50).then(() => {
                assert.equal(redis.store['somevalues:1'][0], 50);
                assert.equal(redis.store['somevalues:2'][0], 50);
                assert.equal(redis.store['somevalues:3'][0], 50);
                
                done();
            }).catch(done);
        });
    });
    
    describe('#get_values', function () {
        it('Should return values by keys', function (done) {
            redis.store = [];
            
            var ManyToOneKey = require('../src/foreign-keys/many-to-one');
            var index = new ManyToOneKey('somevalues:', redis);
            
            redis.store['somevalues:1'] = [2, 3, 4, 5];
            redis.store['somevalues:2'] = [1, 2, 3, 5];
            redis.store['somevalues:3'] = [1, 3, 5];

            index.get_values([1, 2, 3])
                .then((res) => {
                    assert.equal(res.length, 2);
                    
                    assert.equal(res[0], 3);
                    assert.equal(res[1], 5);
                    
                    done();
                }).catch(done);
        });
    });
    
    describe('#delete_key', function () {
        it('Should delete value from all keys', function (done) {
            redis.store = [];

            var ManyToOneKey = require('../src/foreign-keys/many-to-one');
            var index = new ManyToOneKey('somevalues:', redis);

            redis.store['somevalues:1'] = [2, 3, 4, 5];
            redis.store['somevalues:2'] = [1, 2, 3, 5];
            redis.store['somevalues:3'] = [1, 3, 5];
            
            index.delete_key([1, 2, 3], 3)
                .then(() => {
                    assert.equal(redis.store['somevalues:1'].indexOf(3), -1);
                    assert.equal(redis.store['somevalues:2'].indexOf(3), -1);
                    assert.equal(redis.store['somevalues:3'].indexOf(3), -1);
                    
                    done();
                }).catch(done);
        });
    });
});