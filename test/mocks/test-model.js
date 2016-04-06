'use strict';

var test_model = {
    key: 'testmodel:info:',

    fields: ['id', 'name', 'company_id', 'user_id'],

    indexes: {
        company_id: {
            key: 'company:company_models:',
            type: 'one_to_many'
        },
        
        user_id: {
            key: 'user:user_model:',
            type: 'one_to_one'
        }
    },

    functions: []
};

module.exports = test_model;
