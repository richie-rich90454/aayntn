{ Educational reference implementation: Pascal is not a USACO submission language. }
program XorBases;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  BITS = 30;

var
  N, Q, K, Bit: Integer;
  Value, X: LongInt;
  Basis: array[0..BITS - 1] of LongInt;

begin
  for Bit := 0 to BITS - 1 do
    Basis[Bit] := 0;

  N := 0;
  Read(N);
  for K := 1 to N do
  begin
    Value := 0;
    Read(Value);
    for Bit := BITS - 1 downto 0 do
    begin
      if ((Value shr Bit) and 1) = 0 then
        Continue;
      if Basis[Bit] <> 0 then
        Value := Value xor Basis[Bit]
      else
      begin
        Basis[Bit] := Value;
        Break;
      end;
    end;
  end;

  Q := 0;
  Read(Q);
  for K := 1 to Q do
  begin
    X := 0;
    Read(X);
    for Bit := BITS - 1 downto 0 do
      if (Basis[Bit] <> 0) and ((X xor Basis[Bit]) > X) then
        X := X xor Basis[Bit];
    WriteLn(X);
  end;
end.
