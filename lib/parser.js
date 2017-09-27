"use strict";
////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт-библиотека SyntaxAnalysis (SyntaxAnalysis.js) для проекта "Снегопат"
////
//// Описание: Реализует функционал по cинтаксическому анализу исходного кода на
//// внутреннем языке 1С:Предприятия 8.
////
//// Основана на исходном коде скриптлета SyntaxAnalysis.wsc для проекта OpenConf.
////
//// Автор SyntaxAnalysis.wsc: Алексей Диркс <adirks@ngs.ru>
//// Автор порта: Александр Кунташов <kuntashov@gmail.com>
////}
////////////////////////////////////////////////////////////////////////////////////////

var Loki = require('lokijs');

function syntaxanalysis(){
  return SyntaxAnalysis;

}

function SyntaxAnalysis() {

};

SyntaxAnalysis.prototype.parse = function (source) {
  return new _1CModule(source);
};

SyntaxAnalysis.prototype.AnalyseTextDocument = function (source) {
    return new _1CModule(source)
}

SyntaxAnalysis.prototype.Create1CModuleContextDescription = function(initValueTable) {
    return new _1CModuleContextDescription(initValueTable);
}

SyntaxAnalysis.prototype.Create1CMethodDescription = function(parentModule) {
    return new _1CMethodDescription(parentModule);
}

////////////////////////////////////////////////////////////////////////////////////////
////{ Регулярные выражения для поиска конструкций встроенного языка 1С.
////TODO:
////    - Удалить из регулярок определения метода Далее - не имеет смысла для 8.х
////    - Описать индексы и назначения группировок, подобно тому, как сделано для RE_VAR.
SyntaxAnalysis.prototype.RE_COMMENT       = new RegExp('^\\s*((?:(?:(?:"[^"]")*)|(?:[^/]*)|(?:[^/]+/))*)(//.*)?\\s*$', "");
SyntaxAnalysis.prototype.RE_ISCOMMENT     = new RegExp('^\\s*\\/\\/.*', '');
/* Группировки: 1: Объявление метода (процедура/функция), 2: Имя метода, 3: Список параметров метода строкой, 4: "Далее" - имеет смысл только для 7.7. */
//SyntaxAnalysis.RE_PROC          = new RegExp('^\\s*((?:procedure)|(?:function)|(?:процедура)|(?:функция))\\s+([\\wА-яёЁ\\d]+)\\s*\\(([\\wА-яёЁ\\d\\s,.="\']*)\\)\\s*((?:forward)|(?:далее))?(.*)$', "i");
SyntaxAnalysis.prototype.RE_PROC              = new RegExp('^\\s*((?:procedure)|(?:function)|(?:процедура)|(?:функция))\\s+([\\wА-яёЁ\\d]+)\\s*\\(', 'i');
SyntaxAnalysis.prototype.RE_PARAM            = new RegExp('(?:(?:Val)|(?:Знач)\\s+)?([\\wА-яёЁ\\d]+)(\\s*=\\s*(?:(?:"[^"]")|(?:[^,)]*))*)?', "ig");
SyntaxAnalysis.prototype.RE_PARAM_END     = new RegExp('([\\wА-яёЁ\\d\\s,.="\']*)\\)(.*)', 'i');
SyntaxAnalysis.prototype.RE_PROC_END      = new RegExp('((?:EndProcedure)|(?:EndFunction)|(?:КонецПроцедуры)|(?:КонецФункции))', "i");
SyntaxAnalysis.prototype.RE_VARS_DEF      = new RegExp('^\\s*(?:(?:Var)|(?:Перем))\\s*([\\wА-яёЁ\\d,=\\[\\]\\s]*)(\\s+экспорт\\s*)?([\\s;]*)(.*?)$', "i");
SyntaxAnalysis.prototype.RE_RPOC_EXPORT   = new RegExp('\\)\\s*(Экспорт|Export)', "i");
/* Группировки: 1: Имя переменной, 2: Определение размерности массива, 3: Экспорт, 4: Конечный символ ("," или пусто - конец строки). */
SyntaxAnalysis.prototype.RE_VAR           = new RegExp('([\\wА-яёЁ\\d]+)\\s*(\\[[\\d\\s,]*\\])?(\\s+экспорт\\s*)?(?:\\s*(?:,|;|$))', "ig");
SyntaxAnalysis.prototype.RE_VAR_ASSIGN    = new RegExp('([\\wА-яёЁ\\d.]+)\\s*=\\s*(([^;]*);)?', "g");
SyntaxAnalysis.prototype.RE_CALL          = new RegExp('([\\wА-яёЁ\\d.]+)\\s*\\(', "g");
SyntaxAnalysis.prototype.RE_SPACE         = new RegExp('\\s+', "g");
//FIXME:RE_PROC_TORMOZIT  пока не используеться, т.к. нет определения НаКлиенте, НаСервере и т.д. для тонкого клиента.
SyntaxAnalysis.prototype.RE_PROC_TORMOZIT = new RegExp('((Процедура|Функция)(?://[^\\n]*\\n|\\s|^|$)*([А-Яа-я_A-Za-z][А-Яа-я_A-Za-z\\d]*)(?://[^\\n]*\\n|\\s|^|$)*\\(([^\\)]*)\\)((?://[^\\n]*\\n|\\s|^|$)*Экспорт)?)((?:(?:"(?:(?:"")|[^"\\n$])*(?:(?://[^\\n]*\\n|\\s|^|$)*\\|(?:(?:"")|[^"\\n$])*)*(?:"|$)|\\.Конец(?:Процедуры|Функции)|\\r|\\n|.)*?))[^А-Яа-я_A-Za-z0-9\\."]Конец(?:Процедуры|Функции)[^А-Яа-я_A-Za-z0-9]|#[^\\n]*\\n|(?://[^\\n]*\\n|\\s|^|$)', 'igm')
SyntaxAnalysis.prototype.RE_PARAM_TORMOZIT = new RegExp('(?://[^\\n]*\\n|\\s|^|$)*(Знач\\s|Val\\s)?(?://[^\\n]*\\n|\\s|^|$)*([А-Яа-я_A-Za-z][А-Яа-я_A-Za-z0-9]+)(?://[^\\n]*\\n|\\s|^|$)*=?((?:(?://[^\\n]*\\n|\\s|^|$)*|("(?:(?:"")|[^"\\n$])*(?:(?://[^\\n]*\\n|\\s|^|$)*\\|(?:(?:"")|[^"\\n$])*)*(?:"|$))|(?:[^,\\n$]*))+)(?:,|$)','img');
SyntaxAnalysis.prototype.RE_CONTEXT      = new RegExp('^\\s*&\\s*(AtClientAtServerNoContext|AtServerNoContext|AtClientAtServer|AtServer|AtClient|НаСервереБезКонтекста|НаКлиентеНаСервереБезКонтекста|НаКлиентеНаСервере|НаКлиенте|НаСервере)\\s*', 'i')
SyntaxAnalysis.prototype.CONTEXT = { "atclientatservernocontext"   :"AtClientAtServerNoContext",
                        "atservernocontext"             :"AtServerNoContext",
                        "atclientatserver"              :"AtClientAtServer",
                        "atserver"                      :"AtServer",
                        "atclient"                      :"AtClient",
                        "насерверебезконтекста"         :"НаСервереБезКонтекста",
                        "наклиентенасерверебезконтекста":"НаКлиентеНаСервереБезКонтекста",
                        "наклиентенасервере"            :"НаКлиентеНаСервере",
                        "наклиенте"                     :"НаКлиенте",
                        "насервере"                     :"НаСервере"
                        }
SyntaxAnalysis.prototype.CALLSLIMIT = 100;
//SyntaxAnalysis
//SyntaxAnalysis.RE_CRLF          = new RegExp('[\\n]+', "");
////} Регулярные выражения для поиска конструкций встроенного языка 1С.


SyntaxAnalysis.prototype.AnalyseParams = function(sourceCode, Meth) {
	var Matches;
    while( (Matches = this.RE_PARAM_TORMOZIT.exec(sourceCode)) != null ) {
        Meth.Params.push({"name":Matches[2], "byval": Matches[1]!== undefined});
    }
}
SyntaxAnalysis.prototype.AnalyseComments = function(sourceCode){
     var result = sourceCode;
     var Matches = this.RE_COMMENT.exec(sourceCode);
     if( Matches != null )
        result = Matches[1];

     return result
}
SyntaxAnalysis.prototype.AnalyseModule = function (sourceCode, initValueTable, textWindow) {

    var Meth;
    var stStart = 0, stInProc = 1, stInModule = 2, stInVarsDef;
    var state = stStart, PrevState;
    var Match;
    var Context = "";

    var moduleContext = this.Create1CModuleContextDescription(initValueTable);
    let ending = "\n";
    
    if (sourceCode.indexOf("\r\n") > 0) {
        ending = "\r\n";
    }

    var proc_count = 0;
    var Lines = sourceCode.split(ending);
    var n = Lines.length;
    var i = 0;
    var nextPart = '';
    var description = new Array();
    
    while (i < n)
    {
        var str = '';

        if (nextPart)
        {
            str = nextPart;
        }
        else
        {
            str = this.AnalyseComments(Lines[i]);
        }

        switch( state )
        {
        case stStart:
        case stInModule:
            var Matches = this.RE_CONTEXT.exec(str);
            if (Matches!=null) {
                Context = this.CONTEXT[(""+Matches[1]).toLowerCase()];
            } else {
                Matches = this.RE_ISCOMMENT.exec(Lines[i]);
                if (Matches!=null){
                    description.push(Lines[i]);
                } else if (str.trim().length === 0) { //Если пустая строка тогда это уже не описание процедуры, а тупой комментарий модуля. 
                    description = new Array();
                }    
            }
                        
            Matches = this.RE_PROC.exec(str);
            if( Matches != null )
            {
                    Meth = this.Create1CMethodDescription(moduleContext);
                    Meth.description = description.join("\n");
                    description = new Array();
                    Meth.Name = Matches[2];
                    Meth.StartLine = i;
                    Meth.IsProc = (Matches[1].toLowerCase() == 'процедура' || Matches[1].toLowerCase() == 'procedure');

                    Meth.Context = (Context.length>0)?Context:"НаСервере"; //Пока только для тонкого клиента.
                    str = str.substr(Matches.lastIndex);
                    var strParams = '';
                    Matches = this.RE_PARAM_END.exec(str);
                    if (Matches!=null) {
                        strParams = Matches[1]
                    } else {
                        strParams = ''+str;
                        i++;
                        while (i<n) {
                            str = this.AnalyseComments(Lines[i]);
                            if ((Matches = this.RE_PARAM_END.exec(strParams+"\n"+str))!=null) {
                                strParams = Matches[1];
                                break;
                            } else {
                                strParams = strParams+"\n"+str;
                            }
                            i++;
                        }
                    }
                    this.AnalyseParams(strParams, Meth);
                    var endproc = Matches[2]
                    
                    var MathesExport = this.RE_RPOC_EXPORT.exec(str);
                    if (MathesExport != null){
                        Meth.IsExport = true;
                    };

                    moduleContext.addMethod(Meth);
                    proc_count++;
                    state = stInProc;
                    if( (Match = this.RE_PROC_END.exec(endproc)) != null )
                    {
                        state = stInModule;
                        nextPart = endproc.substr(this.RE_PROC_END.lastIndex);
                        if (nextPart)
                            continue;
                    }
            }
            else if ((Matches = this.RE_VARS_DEF.exec(str)) != null)
            {
                str = Matches[1];
                nextPart = Matches[4];
                while( (Matches = this.RE_VAR.exec(str)) != null )
                {
                    if( PrevState == stInProc )
                        Meth.addVar(Matches[1]);
                    else
                        moduleContext.addVar(Matches[1], Matches[3], description);
                }
                if (nextPart)
                    continue;

                str = str.replace(this.RE_SPACE, "");
                if( str.substr(str.length-1) == ";" )
                {
                    state = PrevState;
                }
                else if (str.substr(str.length-1) == ",")
                {
                    PrevState = state;
                    state = stInVarsDef;
                }
                break;
            } else {
                while( (Matches = this.RE_CALL.exec(str)) != null )
                {
                    if (Matches[1].charAt(0) == "."){
                        continue;
                    }
                    if (moduleContext.CallsPosition.length < this.CALLSLIMIT) {
                        moduleContext.CallsPosition.push({"call": Matches[1], "line": i, "character": Lines[i].indexOf(Matches[1])});
                    }
                    if(moduleContext._CallsUpper.indexOf(Matches[1].toUpperCase()) >= 0) {continue};
                    moduleContext.Calls.push(Matches[1]);
                    moduleContext._CallsUpper.push(Matches[1].toUpperCase());
                    if (moduleContext.CallsPosition.length > this.CALLSLIMIT){
                        moduleContext.CallsPosition.push({"call": Matches[1], "line": i, "character": Lines[i].indexOf(Matches[1])});
                    }
    
                }
            } 
            break;
        case stInProc:

            Matches = this.RE_PROC_END.exec(str);
            if( Matches != null )
            {
                if( state == stInProc ) Meth.EndLine = i;
                state = stInModule;
                moduleContext.save(Meth);
            }
            else if( (Matches = this.RE_VARS_DEF.exec(str)) != null )
            {
                var exported = Matches[2];
                var semicolon = Matches[3].replace(this.RE_SPACE, "");
                str = Matches[1];
                while( (Matches = this.RE_VAR.exec(str)) != null )
                {
                    if( state == stInProc )
                        Meth.addVar(Matches[1]);
                    else
                        moduleContext.addVar(Matches[1], Matches[3], description);
                }
                if( semicolon != ";" )
                {
                    PrevState = state;
                    state = stInVarsDef;
                }
            }
            else
            {
                while( (Matches = this.RE_VAR_ASSIGN.exec(str)) != null )
                {
                    var varName = Matches[1];
                    if( varName.indexOf(".", 0) >= 0 ) continue;
                    if (state == stInProc)
                        Meth.addVar(varName, null, true); // automatic var
                    else
                        moduleContext.addVar(varName);
                }

                if( state == stInProc )
                {
                    while( (Matches = this.RE_CALL.exec(str)) != null )
                    {
                        if (Matches[1].charAt(0) == "."){
                            continue;
                        }
                        if (Meth.CallsPosition.length < this.CALLSLIMIT) {
                            Meth.CallsPosition.push(
                                {"call": Matches[1], "line": i, "character": Lines[i].indexOf(Matches[1])}
                            );
                        }
                        if(Meth._CallsUpper.indexOf(Matches[1].toUpperCase()) >= 0) {continue};
                        Meth.Calls.push(Matches[1]);
                        Meth._CallsUpper.push(Matches[1].toUpperCase());
                        //see up - continue
                        if (Meth.CallsPosition.length > this.CALLSLIMIT) {
                            Meth.CallsPosition.push(
                                {"call": Matches[1], "line": i, "character": Lines[i].indexOf(Matches[1])}
                            );
                        }
                         
                    }
                }
            }
            break;

        case stInVarsDef:

            while( (Matches = this.RE_VAR.exec(str)) != null )
            {
                if( PrevState == stInProc )
                    Meth.addVar(Matches[1]);
                else
                    moduleContext.addVar(Matches[1], Matches[3], description);
            }
            str = str.replace(this.RE_SPACE, "");
            if( str.substr(str.length-1) == ";" )
                state = PrevState;
            break;

        }

        i++;
        nextPart = '';
    }

    return moduleContext;
}

////////////////////////////////////////////////////////////////////////////////////////
////{ _1CModule

function _1CModule(sourceText) {
    //this.textWindow = textWindow;
    this.context = new SyntaxAnalysis().AnalyseModule(sourceText, true);
}

/* Возвращает исходный код метода по названию метода. */
_1CModule.prototype.getMethod = function(methodName) {
    var method = this.context.getMethodByName(methodName);
    if (!method) return undefined;
    return method;
}

/* Возвращает таблицу значений с описаниями методов модуля. */
_1CModule.prototype.getMethodsTable = function() {
    return this.context._vtAllMethods;
}

/* Возвращает описание метода по номеру строки, находящейся внутри метода. */
_1CModule.prototype.getMethodByLineNumber = function (lineNo) {

    var methods = this.context.Methods;

    for (var i=0; i<methods.length; i++)
    {
        /* Помним, что нумерация строк начинается с 1,
        а строки модуля в SyntaxAnalysis проиндексированы с 0. */
        if (methods[i].StartLine + 1 <= lineNo && lineNo <= methods[i].EndLine + 1)
            return methods[i];
    }

    return undefined;
}

/* Возвращает описание метода, которому принадлежит текущая строка
(строка, в которой находится курсор). */
_1CModule.prototype.getActiveLineMethod = function () {
    throw("Not implement");
    /*let pos = this.textWindow.GetCaretPos();
    return this.getMethodByLineNumber(pos.beginRow);*/
}

////} _1CModule

////////////////////////////////////////////////////////////////////////////////////////
////{ _1CModuleContextDescription

function _1CModuleContextDescription(initValueTable) {

    // Массив всех методов модуля.
    this.Methods = new Array();

    // Ассоциативный массив Имя метода -> _1CMethodDescription
    this._methodsByName = {};

    // Массив всех явным образом объявленных переменных модуля.
    this.ModuleVars = {};

    // Ассоциативный массив Имя переменной -> Тип переменной (пока тип всегда null).
    this._moduleVarsTypes = {};
    this.Calls = new Array();
    this._CallsUpper = new Array();
    this.CallsPosition = new Array();

    this.db = new Loki('loki.json');


    this._vtAllMethods = null;
    if (initValueTable)
    {
        this._vtAllMethods = this.db.addCollection("ValueTable");

    }
}

_1CModuleContextDescription.prototype.NewString = function () {

  return {
    name:"", //'Имя процедуры/функции'
    isproc:false, //'Процедура = true, Функция = false
    line:0, //начало
    endline:0, //конец процедуры
    context:"", //'Контекст компиляции модуля'
    _method:"", // object
    isexport: false, 
    description: ""
    
  }

};
_1CModuleContextDescription.prototype.addMethod = function (method) {

    if (this._methodsByName[method.Name])
        console.log('Метод ' + method.name + 'уже был объявлен ранее в этом модуле!');

    this.Methods.push(method);
    this._methodsByName[method.Name] = method;

    // Добавляем метод в таблицу значений.
  
}

_1CModuleContextDescription.prototype.save = function (method) {
    if (this._vtAllMethods) {
        if (this._vtAllMethods) {
            var methRow = this.NewString();
            methRow.name = method.Name;
            methRow.isproc = method.IsProc;
            methRow.line = method.StartLine;
            methRow.endline = method.EndLine;
            methRow.context = method.Context;
            methRow.isexport = method.IsExport;
            methRow.description = method.description;
            methRow._method = method;

            this._vtAllMethods.insert(methRow);
        }
    }
}

_1CModuleContextDescription.prototype.getMethodByName = function (name) {
    return this._methodsByName[name];
}

_1CModuleContextDescription.prototype.addVar = function (name, isExport, description, type, auto) {
    if (this._moduleVarsTypes[name] === undefined)
    {
        this._moduleVarsTypes[name] = (type === undefined) ? null : type;
        this.ModuleVars[name] = {};
        this.ModuleVars[name].isExport = (isExport) ? true : false;
    this.ModuleVars[name].description = description.join(" ").replace(new RegExp("\/\/\s*"), "").replace(new RegExp(/\t/), " ");
    }
}

_1CModuleContextDescription.prototype.getVarType = function (name) {
    return this._moduleVarsTypes[name];
}

////} _1CModuleContextDescription

////////////////////////////////////////////////////////////////////////////////////////
////{ _1CMethodDescription

function _1CMethodDescription(parentModule) {

    // Идентификатор (имя) метода.
    this.Name = "";

    // Тип метода. Если истина - то это Процедура, иначе - это функция.
    this.IsProc = false;

    // Массив параметров метода.
    this.Params = new Array();

    // Массив явным образом объявленных переменных.
    this.DeclaredVars = new Array();

    // Массив автоматических локальных переменных (не объявленных явным образом).
    this.AutomaticVars = new Array();

    // Список вызовов: массив методов, вызываемых из данного метода.
    this.Calls = new Array();
    this._CallsUpper = new Array();
    this.CallsPosition = new Array();

    // Номер строки объявления метода.
    this.StartLine = 0;

    // Номер строки завершения объявления метода.
    this.EndLine = 0;

    // Ассоциативный массив Имя переменной -> Тип переменной (пока тип всегда null).
    this._varsTypes = {};

    // Контекст модуля, в котором объявлен данный метод (_1CModuleContextDescription).
    this.parentModule = parentModule;
    
    // Экспортная процедура или нет. 
    this.IsExport = false;
    
    this.description = "";
    
}

_1CMethodDescription.prototype.addVar = function (name, type, auto) {

    if (this._varsTypes[name] === undefined)
    {
        if (this.Params.indexOf(name) >= 0)
            return;

        if (this.parentModule && this.parentModule.getVarType(name) !== undefined)
            return;

        this._varsTypes[name] = (type === undefined) ? null : type;

        if (auto)
            this.AutomaticVars.push(name);
        else
            this.DeclaredVars.push(name);
    }
}

_1CMethodDescription.prototype.getVarType = function (name) {
    return this._varsTypes[name];
}


////} _1CMethodDescription

////////////////////////////////////////////////////////////////////////////////////////
////{ Вспомогательные функции объекта Array
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        for(var i = fromIndex||0, length = this.length; i<length; i++)
            if(this[i] === searchElement) return i;
        return -1
    };
};
////} Вспомогательные функции объекта Array


module.exports = SyntaxAnalysis;
