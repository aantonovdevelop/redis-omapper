'use strict';

var Model = require('../../src/model');

function TestModel(schema) {
    this.fields = ['id', 'name', 'company_id'];

    this.schema = schema;
}

TestModel.prototype = new Model();

module.exports = TestModel;
