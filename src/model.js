'use strict';

function Model() {
    this.check_fields = function () {
        var self = this;
        var result = true;

        var schema = self.to_object();

        if (Object.keys(schema).length != self.fields.length) return false;

        Object.keys(schema).forEach(function (item) {
            if (self.fields.indexOf(item) < 0) {
                result = false;
            }
        });

        return result;
    };

    this.to_object = function () {
        var self = this;
        var result = {};

        self.fields.forEach(field =>
            self[field] ? result[field] = self[field] : null
        );

        return result;
    };
}

module.exports = Model;