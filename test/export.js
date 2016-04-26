"use strict";

var assert = require('assert');

var test_model = require('./mocks/test-model');
var redis = require('@aantonov/redis-mock');

describe('Export', function () {
    it('Should export valid objects', function () {
        var mod = require('../index.js');
        
        assert.equal(mod.create_hash_repository(test_model, redis).constructor.name, 'Repository');
        assert.equal(mod.create_string_repository(test_model, redis).constructor.name, 'Repository');
        
        assert.equal(mod.keys.one_to_one_key('somekey').constructor.name, 'OneToOneKey');
        assert.equal(mod.keys.one_to_many_key('somekey').constructor.name, 'OneToManyKey');
        assert.equal(mod.keys.many_to_many_key('somekey').constructor.name, 'ManyToManyKey');
    });
});