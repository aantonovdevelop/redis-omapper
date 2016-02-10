'use strict';

function Model() {
    this.check_fields = function () {
        var self = this;
        var result = true;

        if (Object.keys(self.schema).length != self.fields.length) return false;

        Object.keys(self.schema).forEach(function (item) {
            if (self.fields.indexOf(item) < 0) {
                result = false;
            }
        });

        return result;
    }
}

module.exports = Model;