{ Educational reference implementation: Pascal is not a USACO submission language. }
program HookLengthFormula;
{$mode objfpc}{$H+}
{$I-}

uses
  SysUtils;

const
  MODULUS = 1000000007;
  BASE = 1024;

function MulMod(A: Int64; B: Int64): Int64;
{ The browser compiler represents Int64 with a JavaScript number, so a direct
  product of two residues loses precision above 2^53. Three 10-bit limbs keep
  every partial product below 2^50, which is exact in a double. }
var
  X: array[0..2] of Int64;
  Y: array[0..2] of Int64;
  Power: array[0..4] of Int64;
  I: LongInt;
  J: LongInt;
  K: LongInt;
  Accumulated: Int64;
begin
  A := A mod MODULUS;
  B := B mod MODULUS;
  for I := 0 to 2 do
  begin
    X[I] := A mod BASE;
    A := A div BASE;
    Y[I] := B mod BASE;
    B := B div BASE;
  end;

  Power[0] := 1;
  for K := 1 to 4 do
    Power[K] := (Power[K - 1] * BASE) mod MODULUS;

  Accumulated := 0;
  for I := 0 to 2 do
    for J := 0 to 2 do
      Accumulated := (Accumulated + (X[I] * Y[J]) * Power[I + J]) mod MODULUS;
  MulMod := Accumulated;
end;

function ModPow(BaseValue: Int64; Exponent: Int64): Int64;
var
  ResultValue: Int64;
  Factor: Int64;
  Power: Int64;
begin
  ResultValue := 1;
  Factor := BaseValue mod MODULUS;
  Power := Exponent;
  while Power > 0 do
  begin
    if (Power mod 2) = 1 then
      ResultValue := MulMod(ResultValue, Factor);
    Factor := MulMod(Factor, Factor);
    Power := Power div 2;
  end;
  ModPow := ResultValue;
end;

var
  K, I, J, Width, N, Hook: LongInt;
  Rows, Heights: array of LongInt;
  Numerator, Denominator, Answer: Int64;

begin
  Read(K);
  if K < 0 then
    Exit;

  SetLength(Rows, K);
  N := 0;
  for I := 0 to K - 1 do
  begin
    Read(Rows[I]);
    N := N + Rows[I];
  end;

  if K > 0 then
    Width := Rows[0]
  else
    Width := 0;
  SetLength(Heights, Width);
  for I := 0 to K - 1 do
    for J := 0 to Rows[I] - 1 do
      Inc(Heights[J]);

  Numerator := 1;
  for I := 2 to N do
    Numerator := MulMod(Numerator, I);

  Denominator := 1;
  for I := 0 to K - 1 do
    for J := 0 to Rows[I] - 1 do
    begin
      Hook := Rows[I] - J + Heights[J] - I - 1;
      Denominator := MulMod(Denominator, Hook);
    end;

  Answer := MulMod(Numerator, ModPow(Denominator, MODULUS - 2));
  WriteLn(IntToStr(Answer));
end.
