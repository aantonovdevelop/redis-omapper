'use strict';

var Model = require('../../src/model');

function TestModel(scheme) {
    this.fields = ['id', 'name'];

    this.scheme = scheme;
}

TestModel.prototype = new Model();

module.exports = TestModel;
