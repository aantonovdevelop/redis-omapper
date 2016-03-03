'use strict';

var test_model = {
    key: 'testmodel:info:',

    fields: ['id', 'name', 'company_id'],

    indexes: [{field: 'company_id', key: 'company:company_models:'}],

    functions: []
};

module.exports = test_model;
