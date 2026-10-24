program MosAlgorithm;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language.

  Mo's algorithm over a static array. The input is n q, then n signed integers,
  then q pairs "l r" with 1 <= l <= r <= n. The maintained answer is the number
  of distinct values in the current window, and the queries are answered in the
  order they appear in the input. }

uses SysUtils;

type
  TIntArray = array of LongInt;

  TQuery = record
    L: LongInt;
    R: LongInt;
    Id: LongInt;
    Block: LongInt;
  end;
  TQueryArray = array of TQuery;

var
  N: LongInt;
  Q: LongInt;
  M: LongInt;
  BlockSize: LongInt;
  A: TIntArray;
  Sorted: TIntArray;
  Rank: TIntArray;
  Queries: TQueryArray;
  Frequency: TIntArray;
  Answers: TIntArray;

{ Bottom-up merge sort of a 32-bit integer array. }
procedure SortInts(var Values: TIntArray; Count: LongInt);
var
  Temp: TIntArray;
  Width, Left, Mid, Right, I, J, K: LongInt;
begin
  if Count <= 1 then
    Exit;
  SetLength(Temp, Count);
  Width := 1;
  while Width < Count do
  begin
    Left := 0;
    while Left < Count do
    begin
      Mid := Left + Width;
      if Mid > Count then
        Mid := Count;
      Right := Mid + Width;
      if Right > Count then
        Right := Count;
      I := Left;
      J := Mid;
      K := Left;
      while (I < Mid) and (J < Right) do
      begin
        if Values[I] <= Values[J] then
        begin
          Temp[K] := Values[I];
          Inc(I);
        end
        else
        begin
          Temp[K] := Values[J];
          Inc(J);
        end;
        Inc(K);
      end;
      while I < Mid do
      begin
        Temp[K] := Values[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Temp[K] := Values[J];
        Inc(J);
        Inc(K);
      end;
      Left := Right;
    end;
    for I := 0 to Count - 1 do
      Values[I] := Temp[I];
    Width := Width * 2;
  end;
end;

{ The first position whose value is not less than Target. }
function LowerBound(const Values: TIntArray; Count: LongInt; Target: LongInt): LongInt;
var
  Lo, Hi, Mid: LongInt;
begin
  Lo := 0;
  Hi := Count;
  while Lo < Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    if Values[Mid] < Target then
      Lo := Mid + 1
    else
      Hi := Mid;
  end;
  LowerBound := Lo;
end;

function QueryBefore(const X, Y: TQuery): Boolean;
begin
  if X.Block <> Y.Block then
    Exit(X.Block < Y.Block);
  if Odd(X.Block) then
    Exit(X.R > Y.R);
  QueryBefore := X.R < Y.R;
end;

{ Bottom-up merge sort of the queries by the block order. }
procedure SortQueries(var Values: TQueryArray; Count: LongInt);
var
  Temp: TQueryArray;
  Width, Left, Mid, Right, I, J, K: LongInt;
begin
  if Count <= 1 then
    Exit;
  SetLength(Temp, Count);
  Width := 1;
  while Width < Count do
  begin
    Left := 0;
    while Left < Count do
    begin
      Mid := Left + Width;
      if Mid > Count then
        Mid := Count;
      Right := Mid + Width;
      if Right > Count then
        Right := Count;
      I := Left;
      J := Mid;
      K := Left;
      while (I < Mid) and (J < Right) do
      begin
        if QueryBefore(Values[J], Values[I]) then
        begin
          Temp[K] := Values[J];
          Inc(J);
        end
        else
        begin
          Temp[K] := Values[I];
          Inc(I);
        end;
        Inc(K);
      end;
      while I < Mid do
      begin
        Temp[K] := Values[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Temp[K] := Values[J];
        Inc(J);
        Inc(K);
      end;
      Left := Right;
    end;
    for I := 0 to Count - 1 do
      Values[I] := Temp[I];
    Width := Width * 2;
  end;
end;

var
  I, K, L, R, CurLeft, CurRight, Distinct, Value: LongInt;

begin
  N := 0;
  Q := 0;
  Read(N);
  Read(Q);

  SetLength(A, N);
  SetLength(Sorted, N);
  SetLength(Rank, N);
  for I := 0 to N - 1 do
  begin
    Read(A[I]);
    Sorted[I] := A[I];
  end;

  SortInts(Sorted, N);

  M := 0;
  for I := 0 to N - 1 do
  begin
    if (I = 0) or (Sorted[I] <> Sorted[I - 1]) then
    begin
      Sorted[M] := Sorted[I];
      Inc(M);
    end;
  end;

  for I := 0 to N - 1 do
    Rank[I] := LowerBound(Sorted, M, A[I]);

  BlockSize := 0;
  while (BlockSize + 1) * (BlockSize + 1) <= N do
    Inc(BlockSize);
  if BlockSize < 1 then
    BlockSize := 1;

  SetLength(Queries, Q);
  for K := 0 to Q - 1 do
  begin
    L := 1;
    R := 1;
    Read(L);
    Read(R);
    Queries[K].L := L;
    Queries[K].R := R;
    Queries[K].Id := K;
    Queries[K].Block := (L - 1) div BlockSize;
  end;

  SortQueries(Queries, Q);

  SetLength(Frequency, M);
  SetLength(Answers, Q);

  CurLeft := 1;
  CurRight := 0;
  Distinct := 0;

  for K := 0 to Q - 1 do
  begin
    L := Queries[K].L;
    R := Queries[K].R;

    while CurLeft > L do
    begin
      Dec(CurLeft);
      Value := Rank[CurLeft - 1];
      if Frequency[Value] = 0 then
        Inc(Distinct);
      Inc(Frequency[Value]);
    end;
    while CurRight < R do
    begin
      Inc(CurRight);
      Value := Rank[CurRight - 1];
      if Frequency[Value] = 0 then
        Inc(Distinct);
      Inc(Frequency[Value]);
    end;
    while CurLeft < L do
    begin
      Value := Rank[CurLeft - 1];
      Dec(Frequency[Value]);
      if Frequency[Value] = 0 then
        Dec(Distinct);
      Inc(CurLeft);
    end;
    while CurRight > R do
    begin
      Value := Rank[CurRight - 1];
      Dec(Frequency[Value]);
      if Frequency[Value] = 0 then
        Dec(Distinct);
      Dec(CurRight);
    end;

    Answers[Queries[K].Id] := Distinct;
  end;

  for K := 0 to Q - 1 do
    WriteLn(IntToStr(Answers[K]));
end.
