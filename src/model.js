'use strict';

function Model() {
    this.checkFields = function () {
        var self = this;
        var result = true;

        Object.keys(self.scheme).forEach(function (item) {
            if (self.fields.indexOf(item) < 0) {
                result = false;
            }
        });

        return result;
    }
}

module.exports = Model;