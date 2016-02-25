"use strict";

require("mocha");
var expect = require("chai").expect;
var fs = require("fs");
var _ = require("underscore");

var Parser = require('../lib/parser');

var objectFixture = fs.readFileSync(__dirname + '/fixtures/module.os', 'utf-8');

describe("Parser", function () {
        var parser;
            

    beforeEach(function () {
        parser = new Parser;
        
    });
    
    describe('Парсинг процедур и фнукций', function () {
        var list;
        var names;
        
        beforeEach(function () {
            list = parser.parse(objectFixture);
            names = _.pluck(list, 'name');
            
        });
        
        it("Парсинг экспортной процедуры", function () {
            expect(names).to.contain("ТестЭкспортФункция");
        })
    })
    }
)

