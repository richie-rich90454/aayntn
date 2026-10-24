{ Educational reference implementation: Pascal is not a USACO submission language. }
program DiscreteLogarithm;

{$mode objfpc}{$H+}

uses SysUtils;

const
  TableSize = 131072;
  TableMask = TableSize - 1;
  Empty = 4294967295;

var
  Keys: array[0..TableSize - 1] of LongWord;
  Values: array[0..TableSize - 1] of LongWord;

{ (A * B) mod M by doubling. Every partial sum stays below 2^32, which is
  exact even when the browser compiler stores Int64 as a double. }
function MulMod(A, B, M: Int64): Int64;
var
  Sum: Int64;
begin
  Result := 0;
  A := A mod M;
  B := B mod M;
  while B > 0 do
  begin
    if (B and 1) = 1 then
    begin
      Sum := Result + A;
      if Sum >= M then
        Sum := Sum - M;
      Result := Sum;
    end;
    A := A + A;
    if A >= M then
      A := A - M;
    B := B shr 1;
  end;
end;

function PowMod(A, E, M: Int64): Int64;
begin
  Result := 1 mod M;
  A := A mod M;
  while E > 0 do
  begin
    if (E and 1) = 1 then
      Result := MulMod(Result, A, M);
    A := MulMod(A, A, M);
    E := E shr 1;
  end;
end;

function CeilSqrt(M: Int64): Int64;
begin
  Result := 1;
  while Result * Result < M do
    Inc(Result);
end;

function DiscreteLog(A, B, M: Int64): Int64;
var
  N, P, Q, Cur, Stride, Key: Int64;
  H: LongWord;
begin
  if B = 1 then
    Exit(0);

  N := CeilSqrt(M);
  for H := 0 to TableSize - 1 do
    Keys[H] := Empty;

  { Baby steps: key B * A^Q, keeping the largest Q for a repeated key. }
  Cur := B mod M;
  for Q := 0 to N - 1 do
  begin
    Key := Cur;
    H := LongWord((Key * 40503) and TableMask);
    while (Keys[H] <> Empty) and (Keys[H] <> LongWord(Key)) do
      H := LongWord((H + 1) and TableMask);
    Keys[H] := LongWord(Key);
    Values[H] := LongWord(Q);
    Cur := MulMod(Cur, A, M);
  end;

  { Giant steps: A^(P * N), matched against the baby-step keys. }
  Stride := PowMod(A, N, M);
  Cur := 1;
  for P := 1 to N do
  begin
    Cur := MulMod(Cur, Stride, M);
    Key := Cur;
    H := LongWord((Key * 40503) and TableMask);
    while Keys[H] <> Empty do
    begin
      if Keys[H] = LongWord(Key) then
      begin
        Result := P * N - Int64(Values[H]);
        Exit;
      end;
      H := LongWord((H + 1) and TableMask);
    end;
  end;

  Result := -1;
end;

var
  Count, I: LongInt;
  A, B, M: Int64;
begin
  Read(Count);
  for I := 1 to Count do
  begin
    Read(A);
    Read(B);
    Read(M);
    WriteLn(DiscreteLog(A, B, M));
  end;
end.
