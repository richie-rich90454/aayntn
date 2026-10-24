{ Educational reference implementation: Pascal is not a USACO submission language. }
program NttProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  RootValue = 3;
  LimbBase = 32768;

type
  TIntArray = array of Int64;

{ The browser Pascal compiler stores Int64 as a double, so a full product of
  two residues would lose its low bits. Splitting both factors into 15-bit
  halves keeps every intermediate below 2^46. }
function SplitMul(A, B, M: Int64): Int64;
var
  AHigh, ALow, BHigh, BLow, R: Int64;
begin
  AHigh := A div LimbBase;
  ALow := A mod LimbBase;
  BHigh := B div LimbBase;
  BLow := B mod LimbBase;
  R := (AHigh * BHigh) mod M;
  R := (R * LimbBase + AHigh * BLow + ALow * BHigh) mod M;
  R := (R * LimbBase + ALow * BLow) mod M;
  Result := R;
end;

function ModPow(Base, Exponent, M: Int64): Int64;
var
  R: Int64;
begin
  R := 1 mod M;
  Base := Base mod M;
  while Exponent > 0 do
  begin
    if (Exponent and 1) = 1 then
      R := SplitMul(R, Base, M);
    Base := SplitMul(Base, Base, M);
    Exponent := Exponent shr 1;
  end;
  Result := R;
end;

procedure Ntt(var A: TIntArray; Invert: Boolean; M: Int64);
var
  N, I, J, Bit, Len, Half, K: Integer;
  WLen, W, U, V, T: Int64;
begin
  N := Length(A);

  J := 0;
  for I := 1 to N - 1 do
  begin
    Bit := N shr 1;
    while (J and Bit) <> 0 do
    begin
      J := J xor Bit;
      Bit := Bit shr 1;
    end;
    J := J xor Bit;
    if I < J then
    begin
      T := A[I];
      A[I] := A[J];
      A[J] := T;
    end;
  end;

  Len := 2;
  while Len <= N do
  begin
    WLen := ModPow(Int64(RootValue), (M - 1) div Len, M);
    if Invert then
      WLen := ModPow(WLen, M - 2, M);
    Half := Len shr 1;
    I := 0;
    while I < N do
    begin
      W := 1;
      for K := I to I + Half - 1 do
      begin
        U := A[K];
        V := SplitMul(A[K + Half], W, M);
        A[K] := (U + V) mod M;
        A[K + Half] := (U - V + M) mod M;
        W := SplitMul(W, WLen, M);
      end;
      I := I + Len;
    end;
    Len := Len shl 1;
  end;

  if Invert then
  begin
    T := ModPow(Int64(N), M - 2, M);
    for I := 0 to N - 1 do
      A[I] := SplitMul(A[I], T, M);
  end;
end;

var
  N, M, Size, I, Total: Integer;
  P, Value: Int64;
  A, B: TIntArray;
begin
  Read(N);
  Read(M);
  ReadLn(P);

  Total := N + M - 1;
  Size := 1;
  while Size < Total do
    Size := Size shl 1;

  SetLength(A, Size);
  SetLength(B, Size);
  for I := 0 to Size - 1 do
  begin
    A[I] := 0;
    B[I] := 0;
  end;

  for I := 0 to N - 1 do
  begin
    Read(Value);
    A[I] := Value mod P;
  end;
  for I := 0 to M - 1 do
  begin
    Read(Value);
    B[I] := Value mod P;
  end;

  Ntt(A, False, P);
  Ntt(B, False, P);
  for I := 0 to Size - 1 do
    A[I] := SplitMul(A[I], B[I], P);
  Ntt(A, True, P);

  for I := 0 to Total - 1 do
  begin
    if I > 0 then
      Write(' ');
    Write(A[I]);
  end;
  WriteLn;
end.
