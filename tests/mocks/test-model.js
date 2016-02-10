'use strict';

var Model = require('../../src/model');

function TestModel(schema) {
    this.fields = ['id', 'name', 'company_id'];

    this.schema = schema;

    this.indexes = [{field: 'company_id', key: 'company:company_models:'}];
}

TestModel.prototype = new Model();

module.exports = TestModel;
