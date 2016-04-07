'use strict';

var keys = require('../../src/foreign-keys');

var test_model = {
    key: 'testmodel:info:',

    fields: ['id', 'name', 'company_id', 'user_id'],

    indexes: {
        company_id: keys.one_to_many_key('company:company_models:'),
        
        user_id: keys.one_to_one_key('user:user_model:'),
        
        options_ids: keys.many_to_one_key('option:option_models:')
    },

    functions: []
};

module.exports = test_model;
