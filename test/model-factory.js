'use strict';

var assert = require('assert'),
    model_factory = require('../src/model-factory'),
    model_schema = require('./mocks/test-model');

describe('ModelFactory', function () {
    it('Should construct new model instance', function () {
        let schema = {
            id: 1,
            name: 'ModelName',
            company_id: 1,
            user_id: 1,
            options_ids: []
        };
        
        let model = model_factory(schema, model_schema);
        
        assert.ok(model);
        assert.equal(model.id, schema.id);
        assert.equal(model.get_id(), schema.id);
    });
});