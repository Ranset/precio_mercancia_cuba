/**
 * Evaluador de expresiones aritméticas simples (+, -, ×, ÷, paréntesis), para
 * poder escribir una cuenta rápida (ej. "12*7") directo en un campo numérico
 * sin salir de la app. No usa eval()/Function(): es un parser propio, así que
 * cualquier texto que no sea una expresión válida simplemente da `null`.
 */

type TokenType = 'num' | '+' | '-' | '*' | '/' | '(' | ')';

interface Token {
  type: TokenType;
  value?: number;
}

function tokenize(input: string): Token[] | null {
  // Alias comunes: símbolos "bonitos" de multiplicar/dividir/restar y coma decimal.
  const s = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.');
  const tokens: Token[] = [];
  let i = 0;

  while (i < s.length) {
    const c = s[i];

    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/' || c === '(' || c === ')') {
      tokens.push({ type: c });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      let seenDot = false;
      while (j < s.length && /[0-9.]/.test(s[j])) {
        if (s[j] === '.') {
          if (seenDot) break;
          seenDot = true;
        }
        j++;
      }
      const num = Number(s.slice(i, j));
      if (Number.isNaN(num)) return null;
      tokens.push({ type: 'num', value: num });
      i = j;
      continue;
    }
    return null; // carácter no reconocido
  }

  return tokens;
}

/** expression := term (('+' | '-') term)*  ·  term := factor (('*' | '/') factor)*  ·  factor := ('+'|'-') factor | num | '(' expression ')' */
class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parseExpression(): number | null {
    let value = this.parseTerm();
    if (value === null) return null;
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next();
      const rhs = this.parseTerm();
      if (rhs === null) return null;
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number | null {
    let value = this.parseFactor();
    if (value === null) return null;
    while (this.peek() === '*' || this.peek() === '/') {
      const op = this.next();
      const rhs = this.parseFactor();
      if (rhs === null) return null;
      if (op === '/') {
        if (rhs === 0) return null; // división entre cero: inválida, no Infinity
        value = value / rhs;
      } else {
        value = value * rhs;
      }
    }
    return value;
  }

  private parseFactor(): number | null {
    const tok = this.tokens[this.pos];
    if (!tok) return null;

    if (tok.type === '+' || tok.type === '-') {
      this.pos++;
      const value = this.parseFactor();
      if (value === null) return null;
      return tok.type === '-' ? -value : value;
    }
    if (tok.type === 'num') {
      this.pos++;
      return tok.value!;
    }
    if (tok.type === '(') {
      this.pos++;
      const value = this.parseExpression();
      if (value === null) return null;
      if (this.tokens[this.pos]?.type !== ')') return null;
      this.pos++;
      return value;
    }
    return null;
  }

  private peek(): TokenType | undefined {
    return this.tokens[this.pos]?.type;
  }

  private next(): TokenType {
    return this.tokens[this.pos++].type;
  }

  isAtEnd(): boolean {
    return this.pos >= this.tokens.length;
  }
}

/** Evalúa una expresión aritmética simple. `null` si está vacía, mal formada, o el resultado no es finito. */
export function evaluateExpression(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const tokens = tokenize(trimmed);
  if (!tokens || tokens.length === 0) return null;

  const parser = new Parser(tokens);
  const result = parser.parseExpression();
  if (result === null || !parser.isAtEnd() || !Number.isFinite(result)) return null;

  return result;
}

/** True si el texto es una operación (tiene +, -, *, /, paréntesis) y no solo un número (posiblemente negativo/decimal). */
export function looksLikeExpression(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed === '') return false;
  return !/^[+-]?\d*\.?\d*$/.test(trimmed);
}
