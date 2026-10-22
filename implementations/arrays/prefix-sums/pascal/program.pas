program PrefixSumsProgram;
{$mode objfpc}{$H+}
{$I-}
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
  N: Integer;
  Q: Integer;
  I: Integer;
  L: Integer;
  R: Integer;
  Value: Int64;
  A: TIntArray;
  Prefix: TIntArray;
  SumText: string;
begin
  { The input is exactly the contract: n, the n values, q and the q ranges. }
  N := 0;
  Read(N);

  { The values start at zero, so a truncated input leaves zeros behind. }
  SetLength(A, N);
  for I := 0 to N - 1 do
  begin
    Value := 0;
    Read(Value);
    A[I] := Value;
  end;

  SetLength(Prefix, N + 1);
  PrefixSums(A, N, Prefix);

  Q := 0;
  Read(Q);
  if Q < 0 then
    Q := 0;

  for I := 0 to Q - 1 do
  begin
    L := 0;
    R := 0;
    Read(L);
    Read(R);

    { A range that leaves the array is clipped, so the lookup stays in
      bounds; a range that is empty after clipping sums to zero. }
    if L < 1 then
      L := 1;
    if R > N then
      R := N;
    if L > R then
      SumText := '0'
    else
      SumText := IntToStr(Prefix[R] - Prefix[L - 1]);
    WriteLn(SumText);
  end;
end.
