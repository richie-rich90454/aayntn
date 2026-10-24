{ Educational reference implementation: JavaScript/Pascal is not a USACO submission language. }
program MultinomialCoefficients;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  MODULO = 1000000007;
  BASE = 1024;

function MulMod(A: Int64; B: Int64): Int64;
{ The browser compiler represents Int64 with JavaScript numbers, so a direct
  product of two residues loses precision above 2^53. Three 10-bit limbs keep
  every partial product below 2^50, which is exact in a double. }
var
  X: array[0..2] of Int64;
  Y: array[0..2] of Int64;
  Power: array[0..4] of Int64;
  I: Integer;
  J: Integer;
  K: Integer;
  ResultValue: Int64;
begin
  A := A mod MODULO;
  B := B mod MODULO;
  for I := 0 to 2 do
  begin
    X[I] := A mod BASE;
    A := A div BASE;
    Y[I] := B mod BASE;
    B := B div BASE;
  end;

  Power[0] := 1;
  for K := 1 to 4 do
    Power[K] := (Power[K - 1] * BASE) mod MODULO;

  ResultValue := 0;
  for I := 0 to 2 do
    for J := 0 to 2 do
      ResultValue := (ResultValue + (X[I] * Y[J]) * Power[I + J]) mod MODULO;
  Result := ResultValue;
end;

function ModPow(BaseValue: Int64; Exponent: Int64): Int64;
var
  ResultValue: Int64;
  Factor: Int64;
  Power: Int64;
begin
  ResultValue := 1;
  Factor := BaseValue mod MODULO;
  Power := Exponent;
  while Power > 0 do
  begin
    if (Power mod 2) = 1 then
      ResultValue := MulMod(ResultValue, Factor);
    Factor := MulMod(Factor, Factor);
    Power := Power div 2;
  end;
  Result := ResultValue;
end;

var
  Line: string;
  N: Integer;
  I: Integer;
  Frequency: array[0..25] of Integer;
  Factorial: array of Int64;
  InverseFactorial: array of Int64;
  Answer: Int64;
begin
  Line := '';
  ReadLn(Line);
  Line := Trim(Line);
  N := Length(Line);

  for I := 0 to 25 do
    Frequency[I] := 0;
  for I := 1 to N do
    Inc(Frequency[Ord(Line[I]) - Ord('a')]);

  SetLength(Factorial, N + 1);
  SetLength(InverseFactorial, N + 1);
  Factorial[0] := 1;
  for I := 1 to N do
    Factorial[I] := MulMod(Factorial[I - 1], I);

  InverseFactorial[N] := ModPow(Factorial[N], MODULO - 2);
  for I := N downto 1 do
    InverseFactorial[I - 1] := MulMod(InverseFactorial[I], I);

  Answer := Factorial[N];
  for I := 0 to 25 do
    Answer := MulMod(Answer, InverseFactorial[Frequency[I]]);

  WriteLn(IntToStr(Answer));

  SetLength(Factorial, 0);
  SetLength(InverseFactorial, 0);
end.
