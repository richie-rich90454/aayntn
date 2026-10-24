{ Educational reference implementation: Pascal is not a USACO submission language. }
program PersistentSegmentTreeProgram;
{$mode objfpc}{$H+}

{
  Persistent segment tree over the compressed values of a static array.

  Version I is the frequency tree of a[0..I), built from version I - 1 by
  copying only the root-to-leaf path of the inserted value. The difference
  between version R and version L - 1 is the frequency tree of a[L-1..R), so
  one descent that subtracts the two left counts returns the K-th smallest.

  Input: N Q, then the N values, then Q lines "L R K" with 1-based inclusive
  bounds. Output: one line per query, holding the K-th smallest value in
  a[L..R].
}

uses
  SysUtils;

type
  TIntArray = array of LongInt;
  TValueArray = array of Int64;

var
  LeftChild, RightChild, Counts: TIntArray;
  Values, Ordered, Roots: TValueArray;
  NodeCount: LongInt;

{ The first index in Data[0..DataLength) whose value is at least Key. }
function LowerBound(const Data: TValueArray; DataLength: LongInt; Key: Int64): LongInt;
var
  Lo, Hi, Mid: LongInt;
begin
  Lo := 0;
  Hi := DataLength;
  while Lo < Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    if Data[Mid] < Key then
      Lo := Mid + 1
    else
      Hi := Mid;
  end;
  Result := Lo;
end;

{ Bottom-up merge sort, so the sort itself has no recursion. }
procedure SortValues(var Data: TValueArray);
var
  Temp: TValueArray;
  N, Width, Left, Middle, Right, I, J, K: LongInt;
begin
  N := Length(Data);
  if N < 2 then
    Exit;
  SetLength(Temp, N);
  Width := 1;
  while Width < N do
  begin
    Left := 0;
    while Left < N do
    begin
      Middle := Left + Width;
      if Middle > N then
        Middle := N;
      Right := Left + 2 * Width;
      if Right > N then
        Right := N;
      I := Left;
      J := Middle;
      K := Left;
      while (I < Middle) and (J < Right) do
      begin
        if Data[I] <= Data[J] then
        begin
          Temp[K] := Data[I];
          Inc(I);
        end
        else
        begin
          Temp[K] := Data[J];
          Inc(J);
        end;
        Inc(K);
      end;
      while I < Middle do
      begin
        Temp[K] := Data[I];
        Inc(I);
        Inc(K);
      end;
      while J < Right do
      begin
        Temp[K] := Data[J];
        Inc(J);
        Inc(K);
      end;
      Left := Left + 2 * Width;
    end;
    for I := 0 to N - 1 do
      Data[I] := Temp[I];
    Width := Width * 2;
  end;
end;

{
  Copy the path to Position and increment every count on it. Node 0 is the
  empty node, so Previous = 0 needs no special case.
}
function Update(Previous, Low, High, Position: LongInt): LongInt;
var
  Node, Middle: LongInt;
begin
  Inc(NodeCount);
  Node := NodeCount;
  LeftChild[Node] := LeftChild[Previous];
  RightChild[Node] := RightChild[Previous];
  Counts[Node] := Counts[Previous] + 1;
  if Low < High then
  begin
    Middle := Low + (High - Low) div 2;
    if Position <= Middle then
      LeftChild[Node] := Update(LeftChild[Previous], Low, Middle, Position)
    else
      RightChild[Node] := Update(RightChild[Previous], Middle + 1, High, Position);
  end;
  Result := Node;
end;

{ The K-th smallest rank in the multiset stored by After minus Before. }
function Kth(Before, After, Low, High, K: LongInt): LongInt;
var
  Middle, InLeft: LongInt;
begin
  while Low < High do
  begin
    Middle := Low + (High - Low) div 2;
    InLeft := Counts[LeftChild[After]] - Counts[LeftChild[Before]];
    if K <= InLeft then
    begin
      Before := LeftChild[Before];
      After := LeftChild[After];
      High := Middle;
    end
    else
    begin
      K := K - InLeft;
      Before := RightChild[Before];
      After := RightChild[After];
      Low := Middle + 1;
    end;
  end;
  Result := Low;
end;

var
  N, Q, M, Depth, I, J, Position, Capacity, Left, Right, K, AnswerIndex: LongInt;

begin
  Read(N);
  Read(Q);
  if N <= 0 then
    Exit;

  SetLength(Values, N);
  for I := 0 to N - 1 do
    Read(Values[I]);

  SetLength(Ordered, N);
  for I := 0 to N - 1 do
    Ordered[I] := Values[I];
  SortValues(Ordered);

  M := 1;
  for I := 1 to N - 1 do
    if Ordered[I] <> Ordered[M - 1] then
    begin
      Ordered[M] := Ordered[I];
      Inc(M);
    end;
  SetLength(Ordered, M);

  Depth := 0;
  J := 1;
  while J < M do
  begin
    J := J * 2;
    Inc(Depth);
  end;

  Capacity := (N + 1) * (Depth + 2) + 1;
  SetLength(LeftChild, Capacity);
  SetLength(RightChild, Capacity);
  SetLength(Counts, Capacity);
  NodeCount := 0;

  SetLength(Roots, N + 1);
  for I := 1 to N do
  begin
    Position := LowerBound(Ordered, M, Values[I - 1]) + 1;
    Roots[I] := Update(Roots[I - 1], 1, M, Position);
  end;

  for J := 0 to Q - 1 do
  begin
    Read(Left);
    Read(Right);
    Read(K);
    AnswerIndex := Kth(Roots[Left - 1], Roots[Right], 1, M, K);
    WriteLn(Ordered[AnswerIndex - 1]);
  end;
end.
