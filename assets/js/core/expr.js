/* ============================================================
   Prism · tiny safe expression compiler for the workshop
   No eval / Function constructor. Supports math + named variables.
   ============================================================ */
(function () {
  'use strict';
  const OL = window.OL = window.OL || {};

  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
    ln: Math.log, log: (x) => Math.log10(x), log2: Math.log2,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    sign: Math.sign,
    min: Math.min, max: Math.max, pow: Math.pow,
    sind: (x) => Math.sin(x * Math.PI / 180),
    cosd: (x) => Math.cos(x * Math.PI / 180),
    tand: (x) => Math.tan(x * Math.PI / 180)
  };
  const CONSTS = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    const s = String(src || '')
      .replace(/π/g, 'pi').replace(/×/g, '*').replace(/÷/g, '/')
      .replace(/−/g, '-').replace(/²/g, '^2').replace(/³/g, '^3');
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        if (s[j] === 'e' || s[j] === 'E') {
          let k = j + 1;
          if (s[k] === '+' || s[k] === '-') k++;
          if (/[0-9]/.test(s[k])) {
            j = k; while (j < s.length && /[0-9]/.test(s[j])) j++;
          }
        }
        const raw = s.slice(i, j);
        const num = Number(raw);
        if (!isFinite(num)) throw new Error('无效数字：' + raw);
        tokens.push({ t: 'num', v: num });
        i = j; continue;
      }
      if (/[a-zA-Z_]/.test(c)) {
        let j = i;
        while (j < s.length && /[a-zA-Z_0-9]/.test(s[j])) j++;
        tokens.push({ t: 'id', v: s.slice(i, j).toLowerCase() });
        i = j; continue;
      }
      if ('+-*/^(),'.indexOf(c) >= 0) {
        tokens.push({ t: c }); i++; continue;
      }
      throw new Error('无法识别的字符：' + c);
    }
    return tokens;
  }

  function parse(src, allowedVars) {
    const tokens = tokenize(src);
    let pos = 0;
    const allowed = {};
    (allowedVars || []).forEach((v) => { allowed[String(v).toLowerCase()] = true; });

    function peek() { return tokens[pos]; }
    function eat(t) {
      if (!tokens[pos] || tokens[pos].t !== t) throw new Error('表达式不完整');
      return tokens[pos++];
    }

    function primary() {
      const tk = peek();
      if (!tk) throw new Error('表达式不完整');
      if (tk.t === 'num') { pos++; return { type: 'num', v: tk.v }; }
      if (tk.t === 'id') {
        pos++;
        const name = tk.v;
        if (peek() && peek().t === '(') {
          if (!FUNCS[name]) throw new Error('未知函数：' + name);
          eat('(');
          const args = [];
          if (peek() && peek().t !== ')') {
            args.push(expr());
            while (peek() && peek().t === ',') { eat(','); args.push(expr()); }
          }
          eat(')');
          if (!args.length) throw new Error('函数 ' + name + ' 需要参数');
          return { type: 'call', name, args };
        }
        if (CONSTS[name] != null) return { type: 'num', v: CONSTS[name] };
        if (!allowed[name]) throw new Error('未定义的变量：' + name);
        return { type: 'var', name };
      }
      if (tk.t === '(') {
        eat('('); const e = expr(); eat(')'); return e;
      }
      if (tk.t === '-') { pos++; return { type: 'neg', e: unary() }; }
      if (tk.t === '+') { pos++; return primary(); }
      throw new Error('表达式语法错误');
    }

    function unary() {
      const tk = peek();
      if (tk && tk.t === '-') { pos++; return { type: 'neg', e: unary() }; }
      if (tk && tk.t === '+') { pos++; return unary(); }
      return primary();
    }

    function power() {
      let left = unary();
      if (peek() && peek().t === '^') { pos++; return { type: 'bin', op: '^', left, right: power() }; }
      return left;
    }

    function term() {
      let left = power();
      while (peek() && (peek().t === '*' || peek().t === '/')) {
        const op = tokens[pos++].t;
        left = { type: 'bin', op, left, right: power() };
      }
      return left;
    }

    function expr() {
      let left = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const op = tokens[pos++].t;
        left = { type: 'bin', op, left, right: term() };
      }
      return left;
    }

    const ast = expr();
    if (pos < tokens.length) throw new Error('表达式末尾有多余内容');
    return ast;
  }

  function evaluate(node, scope) {
    switch (node.type) {
      case 'num': return node.v;
      case 'var': return scope[node.name] == null ? NaN : Number(scope[node.name]);
      case 'neg': return -evaluate(node.e, scope);
      case 'bin': {
        const a = evaluate(node.left, scope), b = evaluate(node.right, scope);
        switch (node.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return b === 0 ? NaN : a / b;
          case '^': return Math.pow(a, b);
        }
        return NaN;
      }
      case 'call': {
        const args = node.args.map((a) => evaluate(a, scope));
        if (node.name === 'pow') return Math.pow(args[0], args[1]);
        return FUNCS[node.name].apply(null, args);
      }
      default: return NaN;
    }
  }

  function compile(src, allowedVars) {
    try {
      const ast = parse(src, allowedVars);
      return {
        ok: true,
        ast,
        eval: function (scope) {
          const v = evaluate(ast, scope || {});
          return typeof v === 'number' && isFinite(v) ? v : NaN;
        }
      };
    } catch (e) {
      return { ok: false, error: e.message, eval: function () { return NaN; } };
    }
  }

  OL.expr = { compile, FUNCS: Object.keys(FUNCS) };
})();
