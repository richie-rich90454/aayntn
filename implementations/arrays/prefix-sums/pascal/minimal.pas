program PrefixSumsMinimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Int64;

{ Prefix sums over an array of values.

  Contract: on return Prefix[0] = 0 and Prefix[i] = Prefix[i-1] + A[i-1]
  for every 1 <= i <= N, so the sum of A[l-1 .. r-1] is
  Prefix[r] - Prefix[l-1].

  Ownership: the caller owns both buffers. Prefix must have room for N+1
  elements; the procedure allocates nothing and frees nothing. }
procedure PrefixSums(const A: array of Int64; N: Integer; var Prefix: TIntArray);
var
  I: Integer;
begin
  if (N < 0) or (Length(A) < N) or (Length(Prefix) < N + 1) then
    Exit;
  Prefix[0] := 0;
  for I := 0 to N - 1 do
    Prefix[I + 1] := Prefix[I] + A[I];
end;

var
  Sample: array[0..4] of Int64 = (1, 2, 3, 4, 5);
  Prefix: TIntArray;
begin
  { Self-check only: the routine above is the reusable part, so this file
    asserts the documented contract instead of reading input. }
  SetLength(Prefix, 6);
  PrefixSums(Sample, 5, Prefix);
  if (Prefix[0] <> 0) or (Prefix[1] <> 1) or (Prefix[5] <> 15) then
    Halt(1);
  { A range sum is the difference of two prefix entries. }
  if Prefix[3] - Prefix[1] <> 5 then
    Halt(1);
end.
