program MeetInTheMiddle;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TInt64Array = array of Int64;

var
  N, I, Middle, LeftSize, RightSize: Integer;
  Limit, Answer: Int64;
  Values, Left, Right, Buffer: TInt64Array;

{ Build one sum per subset of Values[From .. To - 1] by doubling: every old
  subset either excludes the next value or includes it. }
procedure BuildSums(const Source: TInt64Array; FromIndex, ToIndex: Integer;
  var Sums: TInt64Array);
var
  I, J, Size: Integer;
begin
  SetLength(Sums, 1 shl (ToIndex - FromIndex));
  Sums[0] := 0;
  Size := 1;
  for I := FromIndex to ToIndex - 1 do
  begin
    for J := 0 to Size - 1 do
      Sums[Size + J] := Sums[J] + Source[I];
    Size := Size * 2;
  end;
end;

{ Merge sort with a caller-owned buffer of the same length as A. }
procedure MergeSort(var A, Temp: TInt64Array; Lo, Hi: Integer);
var
  Middle, I, J, K: Integer;
begin
  if Lo >= Hi then
    Exit;
  Middle := (Lo + Hi) div 2;
  MergeSort(A, Temp, Lo, Middle);
  MergeSort(A, Temp, Middle + 1, Hi);
  I := Lo;
  J := Middle + 1;
  K := Lo;
  while (I <= Middle) and (J <= Hi) do
  begin
    if A[I] <= A[J] then
    begin
      Temp[K] := A[I];
      Inc(I);
    end
    else
    begin
      Temp[K] := A[J];
      Inc(J);
    end;
    Inc(K);
  end;
  while I <= Middle do
  begin
    Temp[K] := A[I];
    Inc(I);
    Inc(K);
  end;
  while J <= Hi do
  begin
    Temp[K] := A[J];
    Inc(J);
    Inc(K);
  end;
  for K := Lo to Hi do
    A[K] := Temp[K];
end;

{ First index whose entry is strictly greater than Target. }
function UpperBound(const A: TInt64Array; Count: Integer; Target: Int64): Integer;
var
  Lo, Hi, Middle: Integer;
begin
  Lo := 0;
  Hi := Count;
  while Lo < Hi do
  begin
    Middle := Lo + (Hi - Lo) div 2;
    if A[Middle] <= Target then
      Lo := Middle + 1
    else
      Hi := Middle;
  end;
  Result := Lo;
end;

begin
  Read(N);
  Read(Limit);
  SetLength(Values, N);
  for I := 0 to N - 1 do
    Read(Values[I]);

  Middle := N div 2;
  BuildSums(Values, 0, Middle, Left);
  BuildSums(Values, Middle, N, Right);
  LeftSize := Length(Left);
  RightSize := Length(Right);

  SetLength(Buffer, RightSize);
  MergeSort(Right, Buffer, 0, RightSize - 1);

  Answer := 0;
  for I := 0 to LeftSize - 1 do
    Answer := Answer + UpperBound(Right, RightSize, Limit - Left[I]);
  WriteLn(IntToStr(Answer));
end.
