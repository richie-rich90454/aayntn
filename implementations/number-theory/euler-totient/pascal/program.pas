{ Educational reference implementation: Pascal is not a USACO submission language. }
program EulerTotient;

{$mode objfpc}{$H+}

{ Counts the integers in [1, N] that are coprime to N by removing one factor
  (1 - 1 / P) for every distinct prime P of N. }
function Phi(N: Int64): Int64;
var
  Rest, P: Int64;
begin
  Result := N;
  Rest := N;
  P := 2;
  while P * P <= Rest do
  begin
    if Rest mod P = 0 then
    begin
      while Rest mod P = 0 do
        Rest := Rest div P;
      Result := Result - Result div P;
    end;
    Inc(P);
  end;
  if Rest > 1 then
    Result := Result - Result div Rest;
end;

{ Base^Exponent mod Modulus by squaring. The exponent is at most Modulus - 1,
  so the product of two residues stays inside Int64 for Modulus <= 10^9. }
function ModPow(Base, Exponent, Modulus: Int64): Int64;
var
  Square: Int64;
begin
  Result := 1 mod Modulus;
  Square := Base mod Modulus;
  while Exponent > 0 do
  begin
    if (Exponent and 1) = 1 then
      Result := Result * Square mod Modulus;
    Square := Square * Square mod Modulus;
    Exponent := Exponent shr 1;
  end;
end;

var
  N, M, A: Int64;
begin
  Read(N);
  Read(M);
  Read(A);
  WriteLn(Phi(N));
  WriteLn(ModPow(A, Phi(M), M));
end.
