import { describe, expect, it } from 'vitest';
import { evaluateExpression, looksLikeExpression } from './exprEval';

describe('evaluateExpression', () => {
  it('evalúa números simples (enteros, decimales, negativos)', () => {
    expect(evaluateExpression('84')).toBe(84);
    expect(evaluateExpression('3.5')).toBe(3.5);
    expect(evaluateExpression('-5')).toBe(-5);
    expect(evaluateExpression('12.')).toBe(12);
  });

  it('suma, resta, multiplica y divide', () => {
    expect(evaluateExpression('12+7')).toBe(19);
    expect(evaluateExpression('12-7')).toBe(5);
    expect(evaluateExpression('12*7')).toBe(84);
    expect(evaluateExpression('84/7')).toBe(12);
  });

  it('respeta la precedencia de operadores y los paréntesis', () => {
    expect(evaluateExpression('2+3*4')).toBe(14);
    expect(evaluateExpression('(2+3)*4')).toBe(20);
    expect(evaluateExpression('10-2-3')).toBe(5);
    expect(evaluateExpression('100/(2+3)/4')).toBe(5);
  });

  it('acepta × ÷ − y coma decimal como alias', () => {
    expect(evaluateExpression('6×7')).toBe(42);
    expect(evaluateExpression('20÷4')).toBe(5);
    expect(evaluateExpression('10−3')).toBe(7);
    expect(evaluateExpression('2,5*2')).toBe(5);
  });

  it('ignora espacios', () => {
    expect(evaluateExpression('  12 * 7  ')).toBe(84);
  });

  it('devuelve null para vacío, incompleto, inválido o división entre cero', () => {
    expect(evaluateExpression('')).toBeNull();
    expect(evaluateExpression('   ')).toBeNull();
    expect(evaluateExpression('12*')).toBeNull();
    expect(evaluateExpression('12+')).toBeNull();
    expect(evaluateExpression('*12')).toBeNull();
    expect(evaluateExpression('(12+3')).toBeNull();
    expect(evaluateExpression('12/0')).toBeNull();
    expect(evaluateExpression('abc')).toBeNull();
    expect(evaluateExpression('12abc')).toBeNull();
  });
});

describe('looksLikeExpression', () => {
  it('un número simple (incluso a mitad de escribir) no cuenta como expresión', () => {
    expect(looksLikeExpression('')).toBe(false);
    expect(looksLikeExpression('84')).toBe(false);
    expect(looksLikeExpression('-5')).toBe(false);
    expect(looksLikeExpression('3.5')).toBe(false);
    expect(looksLikeExpression('-')).toBe(false);
    expect(looksLikeExpression('12.')).toBe(false);
  });

  it('cualquier operador o paréntesis sí cuenta como expresión', () => {
    expect(looksLikeExpression('12*7')).toBe(true);
    expect(looksLikeExpression('12+7')).toBe(true);
    expect(looksLikeExpression('12*')).toBe(true);
    expect(looksLikeExpression('(12)')).toBe(true);
  });
});
