{ Educational reference implementation: Pascal is not a USACO submission language. }
program BurnsideLemma;
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

function EulerPhi(X: Int64): Int64;
var
  Remaining: Int64;
  P: Int64;
  ResultValue: Int64;
begin
  ResultValue := X;
  Remaining := X;
  P := 2;
  while P * P <= Remaining do
  begin
    if Remaining mod P = 0 then
    begin
      while Remaining mod P = 0 do
        Remaining := Remaining div P;
      ResultValue := ResultValue - ResultValue div P;
    end;
    if P = 2 then
      P := 3
    else
      P := P + 2;
  end;
  if Remaining > 1 then
    ResultValue := ResultValue - ResultValue div Remaining;
  EulerPhi := ResultValue;
end;

function Term(D, N, K: Int64): Int64;
begin
  Term := (EulerPhi(D) * ModPow(K, N div D)) mod MODULO;
end;

var
  N: Int64;
  K: Int64;
  I: Int64;
  D: Int64;
  Answer: Int64;

begin
  Read(N);
  Read(K);
  if (N < 1) or (N > 1000000) or (K < 1) or (K > 1000000000) then
    Exit;

  Answer := 0;
  I := 1;
  while I * I <= N do
  begin
    if N mod I = 0 then
    begin
      Answer := (Answer + Term(I, N, K)) mod MODULO;
      D := N div I;
      if D <> I then
        Answer := (Answer + Term(D, N, K)) mod MODULO;
    end;
    I := I + 1;
  end;

  Answer := MulMod(Answer, ModPow(N, MODULO - 2));
  WriteLn(IntToStr(Answer));
end.
