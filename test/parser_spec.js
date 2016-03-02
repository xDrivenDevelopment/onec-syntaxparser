"use strict";

require("mocha");
var expect = require("chai").expect;
var chai = require("chai");
var fs = require("fs");
var _ = require("underscore");

var Parser = require('../lib/parser.js');

var objectFixture = fs.readFileSync(__dirname + '/fixtures/module.os', 'utf-8');

describe("Parser", function () {
    var parser;
    var list;
    var names;
    var methods;       
    let modulecontext; 

    beforeEach(function () {
        parser = new Parser();
        modulecontext = parser.parse(objectFixture);
        methods = modulecontext.getMethodsTable();
        list = methods.find();
        names = _.pluck(list, 'name');
    });
    
    describe('Должны найти простую функцию', function () {
        beforeEach(function () {
            
        });
        
        it("Парсинг экспортной процедуры", function () {
            expect(names).to.contain("ТестЭкспортФункция");
        });
        
        
    });
    
    describe('Должны найти сложную экспортную функцию', function () {
        var method;
        
        beforeEach(function () {
            method = methods.find(
                {   "isexport":true,
                    "name":"СложнаяФункцияСКучейПараметров"
                }
            )[0];
            
        });
        
        it("Парсинг сложной экспортной процедуры isexport", function () {
            expect(methods.find({"isexport":true}).length).to.equal(2);
        });
        
        it("Функция должна быть иметь 2 параметра _method.Params", function () {
            //console.log(method._method);
            expect(method._method.Params.length).to.equal(2);
        })
        
        it("Функция должна быть иметь 1 вызов _method.Calls", function () {
            expect(method._method.Calls.length).to.equal(2);
        })
        
        it("Функция должна быть иметь большое описание description", function () {
            var text = "dddd"
            expect(method.description.split("\n").length).to.equal(12);
        });
        
        it("Определим по номеру строки к какой функции она относится", function () {
            expect(modulecontext.getMethodByLineNumber(23)).to.be.a('object');
            expect(modulecontext.getMethodByLineNumber(23).Name).to.equal("СложнаяФункцияСКучейПараметров");
        });
        
        it("Определим по наименованию процедуры старт и начало этой процедуры", function () {
            //expect(modulecontext.get)
        })
        
        it("Получим список вызовов внешних функций для процедуры ", function () {
            expect(modulecontext.getMethodByLineNumber(23)).to.be.a("object");
            expect(modulecontext.getMethodByLineNumber(23).Name).to.equal("СложнаяФункцияСКучейПараметров");
        })
        
        
    })
    
    describe("Проверка парсинга комментариев для модуля.", function() {
      let method;
      
      beforeEach(function () {
        method = methods.find(
            {"name":"ТестСКомментарием"}
        )[0];
      });
      
      it("комментарий должен состоять из 2х строк", function(){
          expect(method.description).to.equal("// ТестСКомментарием\n//");
      })  
    })
    }
)

