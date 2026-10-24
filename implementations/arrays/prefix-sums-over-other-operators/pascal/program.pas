{ Educational reference implementation: JavaScript/Pascal is not a USACO submission language. }
program PrefixProductProgram;
{$mode objfpc}{$H+}

uses SysUtils;

const
  Modulo = 1000000007;
  Limb = 32768;

{ Exact a times b modulo Modulo without forming a product above 2^53.
  The browser compiler represents Int64 as a double, so a plain product of two
  residues near 10^9 would lose the low bits. Splitting b into 15-bit halves
  keeps every intermediate below 2^53, and the same routine is exact in Free
  Pascal. }
function MulMod(A, B: Int64): Int64;
var
  High, Low: Int64;
begin
  High := (B div Limb) mod Limb;
  Low := B mod Limb;
  MulMod := ((A * High mod Modulo) * Limb + A * Low) mod Modulo;
end;

function ModPower(Base, Exponent: Int64): Int64;
var
  Accumulated: Int64;
begin
  Accumulated := 1;
  Base := Base mod Modulo;
  while Exponent > 0 do
  begin
    if (Exponent and 1) <> 0 then
      Accumulated := MulMod(Accumulated, Base);
    Base := MulMod(Base, Base);
    Exponent := Exponent shr 1;
  end;
  ModPower := Accumulated;
end;

var
  N, Q, I, L, R: LongInt;
  X: Int64;
  Value: array of Int64;
  Product: array of Int64;
  Inverse: array of Int64;
  ZeroCount: array of Int64;

begin
  Read(N);
  SetLength(Value, N + 1);
  SetLength(Product, N + 1);
  SetLength(Inverse, N + 1);
  SetLength(ZeroCount, N + 1);

  Product[0] := 1;
  for I := 1 to N do
  begin
    Read(X);
    X := X mod Modulo;
    if X < 0 then
      X := X + Modulo;
    Value[I] := X;
    if X = 0 then
      ZeroCount[I] := ZeroCount[I - 1] + 1
    else
      ZeroCount[I] := ZeroCount[I - 1];
    if X = 0 then
      Product[I] := Product[I - 1]
    else
      Product[I] := MulMod(Product[I - 1], X);
  end;

  Inverse[N] := ModPower(Product[N], Modulo - 2);
  for I := N downto 1 do
  begin
    if Value[I] = 0 then
      Inverse[I - 1] := Inverse[I]
    else
      Inverse[I - 1] := MulMod(Inverse[I], Value[I]);
  end;

  Read(Q);
  for I := 1 to Q do
  begin
    Read(L);
    Read(R);
    if ZeroCount[R] - ZeroCount[L - 1] > 0 then
      WriteLn('0')
    else
      WriteLn(MulMod(Product[R], Inverse[L - 1]));
  end;
end.
