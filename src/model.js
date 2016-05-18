'use strict';

function Model() {
    this.check_fields = function () {
        var self = this;
        var result = true;

        var schema = self.to_object();

        if (Object.keys(schema).length != Object.keys(self.fields).length) return false;

        Object.keys(self.fields).forEach(field => {
            !this.schema.hasOwnProperty(field) ? result = false : null;
        });
        
        return result;
    };

    this.to_object = function () {
        var self = this;
        var result = {};

        Object.keys(self.fields).forEach(field =>
            result[field] = self[field]
        );

        return result;
    };
}

module.exports = Model;