'use strict';

var Model = require('./model');

module.exports = model_factory;

/**
 * Create Model instance
 * 
 * @param {Object} schema Model fields object
 * @param {Object} model_schema Model schema
 * 
 * @returns {Model}
 */
function model_factory (schema, model_schema) {

    var model = new Model();

    model.schema = schema;
    model.fields = model_schema.fields;
    
    set_model_fields(schema, model_schema, model);
    set_model_functions(model_schema, model);

    return model;
}

function set_model_functions(model_schema, model) {
    model_schema.functions ? model_schema.functions.forEach(fn => model[fn.name] = fn.fn.bind(model)) : null;
}

function set_model_fields(schema, model_schema, model) {
    schema ? Object.keys(model_schema.fields).forEach(field => model[field] = schema[field]) : null;
}

