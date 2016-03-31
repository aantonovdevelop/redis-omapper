'use strict';

var test_model = {
    key: 'testmodel:info:',

    fields: ['id', 'name', 'company_id'],

    indexes: {company_id: 'company:company_models:'},

    functions: []
};

module.exports = test_model;
