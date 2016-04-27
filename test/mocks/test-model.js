'use strict';

var keys = require('../../src/foreign-keys');

var test_model = {
    key: 'testmodel:info:',

    fields: {
        id: 'Number',
        name: 'String',
        company_id: 'String',
        user_id: 'Number',
        options_ids: 'Array'
    },

    indexes: {
        company_id: keys.one_to_many_key('company:company_models:'),
        
        user_id: keys.one_to_one_key('user:user_model:'),
        
        options_ids: keys.many_to_many_key('option:option_models:', 'testmodel:model_options:')
    },

    functions: []
};

module.exports = test_model;
