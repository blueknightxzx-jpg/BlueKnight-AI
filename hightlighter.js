/* ============================================
   BlueKnight AI — Syntax Highlighter
   Lightweight tokenizer for 6 languages.
   ============================================ */

(function() {
    'use strict';

    if (!window.BK) window.BK = {};

    var CLS = {
        keyword:    'token-keyword',
        string:     'token-string',
        number:     'token-number',
        comment:    'token-comment',
        operator:   'token-operator',
        function:   'token-function',
        tag:        'token-tag',
        attribute:  'token-attribute',
        property:   'token-property',
        type:       'token-type',
        builtin:    'token-builtin',
        decorator:  'token-decorator',
        preprocessor: 'token-preprocessor',
        punctuation: 'token-punctuation'
    };

    var JS_KEYWORDS = 'break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await|of|static|get|set|constructor'.split('|');
    var JS_TYPES = 'true|false|null|undefined|Infinity|NaN'.split('|');
    var JS_BUILTINS = 'console|document|window|Math|Date|Array|Object|String|Number|Boolean|RegExp|JSON|Promise|Set|Map|WeakMap|WeakSet|Symbol|Error|parseInt|parseFloat|isNaN|isFinite|eval|setTimeout|setInterval|clearTimeout|clearInterval|require|module|exports|global|process|Buffer'.split('|');

    var PY_KEYWORDS = 'and|as|assert|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield|async|await'.split('|');
    var PY_BUILTINS = 'print|len|range|enumerate|zip|map|filter|sum|min|max|abs|round|int|str|float|list|dict|tuple|set|frozenset|bool|type|isinstance|hasattr|getattr|setattr|delattr|open|input|exit|help|dir|super|object|self|cls'.split('|');

    var CPP_KEYWORDS = 'alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq'.split('|');
    var CPP_TYPES = 'int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|size_t|ssize_t|ptrdiff_t|intptr_t|uintptr_t|string|vector|map|set|unordered_map|unordered_set|array|deque|list|queue|stack|priority_queue|pair|tuple|optional|variant|unique_ptr|shared_ptr|weak_ptr|make_unique|make_shared|std'.split('|');

    var CS_KEYWORDS = 'abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|add|alias|ascending|descending|dynamic|from|get|global|group|into|join|let|orderby|partial|remove|select|set|value|var|where|yield'.split('|');
    var CS_TYPES = 'true|false|null|String|Int32|Int64|Boolean|Double|Single|Decimal|DateTime|TimeSpan|Object|Console|Math|List|Dictionary|HashSet|IEnumerable|IQueryable|Task|Action|Func|EventArgs|Exception|ArgumentException|InvalidOperationException|Nullable'.split('|');

    function escHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function span(cls, text) {
        return '<span class="' + cls + '">' + text + '</span>';
    }

    function makeWordPattern(words) {
        return new RegExp('\\b(' + words.join('|') + ')\\b', 'g');
    }

    /* ---------- Language: HTML ---------- */
    function highlightHTML(code) {
        var lines = code.split('\n');
        var inComment = false;
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var html = escHtml(line);
            if (inComment) {
                var endIdx = line.indexOf('-->');
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + 3);
                    var after = line.substring(endIdx + 3);
                    html = span(CLS.comment, escHtml(before)) + highlightHTMLLine(escHtml(after));
                    inComment = false;
                } else {
                    html = span(CLS.comment, html);
                }
            } else {
                html = highlightHTMLLine(html);
                if (line.indexOf('<!--') !== -1 && line.indexOf('-->') === -1) inComment = true;
            }
            out.push(html);
        }
        return out.join('\n');
    }

    function highlightHTMLLine(html) {
        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, function(m) { return span(CLS.comment, m); });
        html = html.replace(/&lt;!DOCTYPE[^&]*&gt;/gi, function(m) { return span(CLS.preprocessor, m); });
        html = html.replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, function(m, p1, p2) { return p1 + span(CLS.tag, p2); });
        html = html.replace(/(&gt;)/g, function(m) { return span(CLS.punctuation, m); });
        html = html.replace(/\b([a-zA-Z-:]+)(=)/g, function(m, p1, p2) { return span(CLS.attribute, p1) + span(CLS.operator, p2); });
        html = html.replace(/(&quot;[^&]*?&quot;)/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/(&#39;[^&#]*?&#39;)/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/(&amp;[a-zA-Z0-9#]+;)/g, function(m) { return span(CLS.number, m); });
        return html;
    }

    /* ---------- Language: CSS ---------- */
    function highlightCSS(code) {
        var lines = code.split('\n');
        var inComment = false;
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var html = escHtml(line);
            if (inComment) {
                var endIdx = line.indexOf('*/');
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + 2);
                    var after = line.substring(endIdx + 2);
                    html = span(CLS.comment, escHtml(before)) + highlightCSSLine(escHtml(after));
                    inComment = false;
                } else {
                    html = span(CLS.comment, html);
                }
            } else {
                html = highlightCSSLine(html);
                if (line.indexOf('/*') !== -1 && line.indexOf('*/') === -1) inComment = true;
            }
            out.push(html);
        }
        return out.join('\n');
    }

    function highlightCSSLine(html) {
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, function(m) { return span(CLS.comment, m); });
        html = html.replace(/("[^"]*")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/('[^']*')/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/(@[a-z-]+)/gi, function(m) { return span(CLS.preprocessor, m); });
        html = html.replace(/\b([a-z-]+)(\s*:)/gi, function(m, p1, p2) { return span(CLS.property, p1) + p2; });
        html = html.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|vmin|vmax|ex|ch|cm|mm|in|pt|pc|deg|rad|turn|s|ms|hz|khz|dpi|dpcm|dppx)\b/gi, function(m, p1, p2) { return span(CLS.number, p1) + span(CLS.type, p2); });
        html = html.replace(/\b(\d+\.?\d*)\b/g, function(m) { return span(CLS.number, m); });
        html = html.replace(/(#[a-fA-F0-9]{3,8})/g, function(m) { return span(CLS.number, m); });
        html = html.replace(/(::?[a-z-]+)/gi, function(m) { return span(CLS.builtin, m); });
        html = html.replace(/(!important)/gi, function(m) { return span(CLS.keyword, m); });
        return html;
    }

    /* ---------- Language: JavaScript ---------- */
    function highlightJS(code) {
        var lines = code.split('\n');
        var inBlockComment = false;
        var inTemplate = false;
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var html = escHtml(line);
            if (inBlockComment) {
                var endIdx = line.indexOf('*/');
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + 2);
                    var after = line.substring(endIdx + 2);
                    html = span(CLS.comment, escHtml(before)) + highlightJSLine(escHtml(after));
                    inBlockComment = false;
                } else {
                    html = span(CLS.comment, html);
                }
            } else if (inTemplate) {
                var endIdx = line.indexOf('`');
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + 1);
                    var after = line.substring(endIdx + 1);
                    html = span(CLS.string, escHtml(before)) + highlightJSLine(escHtml(after));
                    inTemplate = false;
                } else {
                    html = span(CLS.string, html);
                }
            } else {
                html = highlightJSLine(html);
                if (line.indexOf('/*') !== -1 && line.indexOf('*/') === -1) inBlockComment = true;
                var tplMatch = line.match(/`/g);
                if (tplMatch && tplMatch.length % 2 === 1 && line.indexOf('\\`') === -1) inTemplate = true;
            }
            out.push(html);
        }
        return out.join('\n');
    }

    function highlightJSLine(html) {
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, function(m) { return span(CLS.comment, m); });
        html = html.replace(/(\/\/.*$)/gm, function(m) { return span(CLS.comment, m); });
        html = html.replace(/(`[^`]*`)/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/("(?:[^"\\]|\\.)*")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/('(?:[^'\\]|\\.)*')/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/(\/(?:[^\/\\]|\\.)+\/[gimuy]*)/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/\b([a-zA-Z_$][\w$]*)\s*(\()/g, function(m, p1, p2) { return span(CLS.function, p1) + p2; });
        html = html.replace(makeWordPattern(JS_KEYWORDS), function(m) { return span(CLS.keyword, m); });
        html = html.replace(makeWordPattern(JS_TYPES), function(m) { return span(CLS.type, m); });
        html = html.replace(makeWordPattern(JS_BUILTINS), function(m) { return span(CLS.builtin, m); });
        html = html.replace(/\b(0[xX][0-9a-fA-F]+|0[oO]?[0-7]+|0[bB][01]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, function(m) { return span(CLS.number, m); });
        html = html.replace(/(===|!==|==|!=|=>|&&|\|\||\+\+|--|[-+*/%=<>!&|^~])/g, function(m) { return span(CLS.operator, m); });
        return html;
    }

    /* ---------- Language: Python ---------- */
    function highlightPython(code) {
        var lines = code.split('\n');
        var inTripleString = false;
        var tripleQuote = '';
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var html = escHtml(line);
            if (inTripleString) {
                var endIdx = line.indexOf(tripleQuote);
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + tripleQuote.length);
                    var after = line.substring(endIdx + tripleQuote.length);
                    html = span(CLS.string, escHtml(before)) + highlightPythonLine(escHtml(after));
                    inTripleString = false;
                    tripleQuote = '';
                } else {
                    html = span(CLS.string, html);
                }
            } else {
                var d3 = line.indexOf('"""');
                var s3 = line.indexOf("'''");
                if (d3 !== -1 && (s3 === -1 || d3 < s3)) {
                    var after = line.substring(d3 + 3);
                    if (after.indexOf('"""') === -1) { inTripleString = true; tripleQuote = '"""'; }
                } else if (s3 !== -1) {
                    var after = line.substring(s3 + 3);
                    if (after.indexOf("'''") === -1) { inTripleString = true; tripleQuote = "'''"; }
                }
                html = highlightPythonLine(html);
            }
            out.push(html);
        }
        return out.join('\n');
    }

    function highlightPythonLine(html) {
        html = html.replace(/(#.*$)/gm, function(m) { return span(CLS.comment, m); });
        html = html.replace(/("""[\s\S]*?""")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/('''[\s\S]*?''')/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/("(?:[^"\\]|\\.)*")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/('(?:[^'\\]|\\.)*')/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/(@[\w.]+)/g, function(m) { return span(CLS.decorator, m); });
        html = html.replace(/\b(def)\s+([a-zA-Z_]\w*)/g, function(m, p1, p2) { return span(CLS.keyword, p1) + ' ' + span(CLS.function, p2); });
        html = html.replace(/\b(class)\s+([a-zA-Z_]\w*)/g, function(m, p1, p2) { return span(CLS.keyword, p1) + ' ' + span(CLS.type, p2); });
        html = html.replace(makeWordPattern(PY_KEYWORDS), function(m) { return span(CLS.keyword, m); });
        html = html.replace(makeWordPattern(PY_BUILTINS), function(m) { return span(CLS.builtin, m); });
        html = html.replace(/\b(0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+\.?\d*(?:[eE][+-]?\d+)?[jJ]?)\b/g, function(m) { return span(CLS.number, m); });
        html = html.replace(/(\*\*|\/\/|<<|>>|<=|>=|==|!=|[-+*/%=<>!&|^~])/g, function(m) { return span(CLS.operator, m); });
        return html;
    }

    /* ---------- Language: C++ ---------- */
    function highlightCPP(code) {
        var lines = code.split('\n');
        var inBlockComment = false;
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var html = escHtml(line);
            if (inBlockComment) {
                var endIdx = line.indexOf('*/');
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + 2);
                    var after = line.substring(endIdx + 2);
                    html = span(CLS.comment, escHtml(before)) + highlightCPPLine(escHtml(after));
                    inBlockComment = false;
                } else {
                    html = span(CLS.comment, html);
                }
            } else {
                html = highlightCPPLine(html);
                if (line.indexOf('/*') !== -1 && line.indexOf('*/') === -1) inBlockComment = true;
            }
            out.push(html);
        }
        return out.join('\n');
    }

    function highlightCPPLine(html) {
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, function(m) { return span(CLS.comment, m); });
        html = html.replace(/(\/\/.*$)/gm, function(m) { return span(CLS.comment, m); });
        html = html.replace(/^(\s*#[\s\S]*$)/gm, function(m) { return span(CLS.preprocessor, m); });
        html = html.replace(/("(?:[^"\\]|\\.)*")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/('(?:[^'\\]|\\.)*')/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/\b([a-zA-Z_]\w*)\s*(\()/g, function(m, p1, p2) { return span(CLS.function, p1) + p2; });
        html = html.replace(makeWordPattern(CPP_KEYWORDS), function(m) { return span(CLS.keyword, m); });
        html = html.replace(makeWordPattern(CPP_TYPES), function(m) { return span(CLS.type, m); });
        html = html.replace(/\b(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.?\d*(?:[eE][+-]?\d+)?[fFlL]?)\b/g, function(m) { return span(CLS.number, m); });
        html = html.replace(/(<<|>>|<=|>=|==|!=|&&|\|\||\+\+|--|[-+*/%=<>!&|^~])/g, function(m) { return span(CLS.operator, m); });
        return html;
    }

    /* ---------- Language: C# ---------- */
    function highlightCS(code) {
        var lines = code.split('\n');
        var inBlockComment = false;
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var html = escHtml(line);
            if (inBlockComment) {
                var endIdx = line.indexOf('*/');
                if (endIdx !== -1) {
                    var before = line.substring(0, endIdx + 2);
                    var after = line.substring(endIdx + 2);
                    html = span(CLS.comment, escHtml(before)) + highlightCSLine(escHtml(after));
                    inBlockComment = false;
                } else {
                    html = span(CLS.comment, html);
                }
            } else {
                html = highlightCSLine(html);
                if (line.indexOf('/*') !== -1 && line.indexOf('*/') === -1) inBlockComment = true;
            }
            out.push(html);
        }
        return out.join('\n');
    }

    function highlightCSLine(html) {
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, function(m) { return span(CLS.comment, m); });
        html = html.replace(/(\/\/.*$)/gm, function(m) { return span(CLS.comment, m); });
        html = html.replace(/(@")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/("(?:[^"\\]|\\.)*")/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/('(?:[^'\\]|\\.)*')/g, function(m) { return span(CLS.string, m); });
        html = html.replace(/(\[[\s\S]*?\])/g, function(m) { return span(CLS.decorator, m); });
        html = html.replace(/\b([a-zA-Z_]\w*)\s*(\()/g, function(m, p1, p2) { return span(CLS.function, p1) + p2; });
        html = html.replace(makeWordPattern(CS_KEYWORDS), function(m) { return span(CLS.keyword, m); });
        html = html.replace(makeWordPattern(CS_TYPES), function(m) { return span(CLS.type, m); });
        html = html.replace(/\b(0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?[mMfFdD]?)\b/g, function(m) { return span(CLS.number, m); });
        html = html.replace(/(=>|<=|>=|==|!=|&&|\|\||\+\+|--|[-+*/%=<>!&|^~])/g, function(m) { return span(CLS.operator, m); });
        return html;
    }

    /* ---------- Public API ---------- */
    var highlighter = {
        name: 'highlighter',
        languages: {
            html: highlightHTML, css: highlightCSS, js: highlightJS, ts: highlightJS,
            py: highlightPython, cpp: highlightCPP, cs: highlightCS,
            c: highlightCPP, h: highlightCPP, hpp: highlightCPP,
            java: highlightCPP, json: highlightJS, gd: highlightPython,
            lua: highlightJS, glsl: highlightCPP
        },
        tokenize: function(code, language) {
            var fn = this.languages[language];
            if (!fn) return escHtml(code);
            return fn(code);
        },
        getLanguageFromType: function(type) {
            var map = {
                html: 'html', htm: 'html', css: 'css', js: 'js', ts: 'ts', json: 'json',
                py: 'py', cpp: 'cpp', c: 'cpp', h: 'cpp', hpp: 'cpp', cs: 'cs',
                java: 'java', gd: 'gd', lua: 'lua', glsl: 'glsl'
            };
            return map[type] || null;
        },
        injectStyles: function() {
            if (document.getElementById('bk-highlight-styles')) return;
            var style = document.createElement('style');
            style.id = 'bk-highlight-styles';
            style.textContent =
                '.token-keyword    { color: #ff7b72; }' +
                '.token-string     { color: #a5d6ff; }' +
                '.token-number     { color: #79c0ff; }' +
                '.token-comment    { color: #8b949e; font-style: italic; }' +
                '.token-operator   { color: #ff7b72; }' +
                '.token-function   { color: #d2a8ff; }' +
                '.token-tag        { color: #7ee787; }' +
                '.token-attribute  { color: #79c0ff; }' +
                '.token-property   { color: #a5d6ff; }' +
                '.token-type       { color: #ffa657; }' +
                '.token-builtin    { color: #79c0ff; }' +
                '.token-decorator  { color: #d2a8ff; }' +
                '.token-preprocessor { color: #ff7b72; }' +
                '.token-punctuation { color: #c9d1d9; }';
            document.head.appendChild(style);
        }
    };

    BK.highlighter = highlighter;
    BK.registerModule('highlighter', highlighter);
})();
