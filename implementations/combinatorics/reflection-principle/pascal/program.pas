{ Educational reference implementation: Pascal is not a USACO submission language. }
program ReflectionPrinciple;
{$mode objfpc}{$H+}

uses SysUtils;

const
  MODULO = 1000000007;

{ (A * B) mod MODULO without a product above 2^53. The reference compiler
  maps Int64 to a JavaScript number, so two residues cannot be multiplied
  directly. }
function MulMod(A, B: Int64): Int64;
var
  Accumulated: Int64;
begin
  A := A mod MODULO;
  Accumulated := 0;
  while B > 0 do
  begin
    if Odd(B) then
      Accumulated := (Accumulated + A) mod MODULO;
    A := (A * 2) mod MODULO;
    B := B div 2;
  end;
  MulMod := Accumulated;
end;

function ModPow(Base, Exponent: Int64): Int64;
var
  Accumulated: Int64;
begin
  Accumulated := 1;
  Base := Base mod MODULO;
  while Exponent > 0 do
  begin
    if Odd(Exponent) then
      Accumulated := MulMod(Accumulated, Base);
    Base := MulMod(Base, Base);
    Exponent := Exponent div 2;
  end;
  ModPow := Accumulated;
end;

function Binomial(N, K: Int64): Int64;
var
  I: Int64;
  Numerator: Int64;
  Denominator: Int64;
begin
  if (K < 0) or (K > N) then
    Exit(0);
  if K > N - K then
    K := N - K;
  Numerator := 1;
  Denominator := 1;
  for I := 0 to K - 1 do
  begin
    Numerator := (Numerator * (N - I)) mod MODULO;
    Denominator := (Denominator * (I + 1)) mod MODULO;
  end;
  Binomial := MulMod(Numerator, ModPow(Denominator, MODULO - 2));
end;

var
  N: Int64;
  Total: Int64;
  Bad: Int64;

begin
  Read(N);
  if (N < 0) or (N > 1000000) then
    Exit;

  Total := Binomial(2 * N, N);
  Bad := Binomial(2 * N, N - 1);
  WriteLn(IntToStr((Total - Bad + MODULO) mod MODULO));
end.
