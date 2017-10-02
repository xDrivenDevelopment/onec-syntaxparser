"use strict";

require("mocha");
var expect = require("chai").expect;
var chai = require("chai");
var fs = require("fs");
var _ = require("underscore");

var Parser = require('../lib/parser.js');

var objectFixture = fs.readFileSync(__dirname + '/fixtures/module_en.os', 'utf-8');

describe("Parser en", function () {
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

        it("Функция должна быть иметь 2 параметра и один из них по значению _method.Params", function () {
            //console.log(method._method);
            expect(method._method.Params.length).to.equal(2);
            expect(method._method.Params[0]).to.deep.eq({"name":"ЗнакТабуляции", "byval": true, "default":""});
            expect(method._method.Params[1]).to.deep.eq({"name":"НоваяФичаТипаСруктуры", "byval": false, "default":"Неопределено"});        })
        
        it("Функция должна быть иметь 3 вызова внешних процедур", function () {
            expect(method._method.Calls.length).to.equal(3);
        })
        
        it("Функция ТестЭкспортФункция1 должна быть иметь 2 вызова и иметь позицию строки в 25 и линии 3 с учетом tab", function () {
            let name = "ТестЭкспортФункция1";
            expect(method._method.Calls).to.contain(name)
            for (var key in method._method.CallsPosition) {
                if (method._method.CallsPosition.hasOwnProperty(key)) {
                    var element = method._method.CallsPosition[key];
                    if (element.call.toUpperCase() === name.toUpperCase() ){
                        expect(element.line).to.equal(25);
                        expect(element.character).to.equal(10);
                        break;
                    }
                }
            }
           
        })
        
        
        it("Функция должна быть иметь большое описание description", function () {
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
    it("Должны найти вызов функции в модуле 'СложнаяФункцияСКучейПараметров'", function () {
            expect(modulecontext.context.Calls.length).to.equal(1);
    })
    
})

