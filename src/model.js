'use strict';

function Model() {
    this.check_fields = function () {
        var self = this;
        var result = true;

        var schema = self.to_object();

        if (Object.keys(schema).length != Object.keys(self.fields).length) return false;

        Object.keys(schema).forEach(item =>
            Object.keys(self.fields).indexOf(item) < 0 ? result = false : null
        );

        return result;
    };

    this.to_object = function () {
        var self = this;
        var result = {};

        Object.keys(self.fields).forEach(field =>
            self[field] ? result[field] = self[field] : field === 'id' ? result[field] = undefined : null
        );

        return result;
    };
}

module.exports = Model;