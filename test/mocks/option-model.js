"use strict";

var keys = require('../../src/foreign-keys');

var option_model = {
    key: 'option:',

    fields: {
        id: 'Number',
        name: 'String',
        company_id: 'Number',
        models_ids: 'Array'
    },

    indexes: {
        company_id: keys.one_to_many_key('company:company_options:'),
        models_ids: keys.many_to_many_key('testmodel:model_options:', 'option:option_models:')
    },

    functions: []
};

module.exports = option_model;
