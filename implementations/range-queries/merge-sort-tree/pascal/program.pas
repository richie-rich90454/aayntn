{ Educational reference implementation: Pascal is not a USACO submission language. }
program MergeSortTreeProgram;
{$mode objfpc}{$H+}

{
  A merge sort tree over a static array.

  Every node of a segment tree stores the sorted values of its interval, and a
  rank query binary searches the O(log n) nodes that partition the requested
  range.

  Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
  bounds. Output: one line per query, holding the k-th smallest value in
  a[l..r].
}

type
  TIntArray = array of Int64;
  TTree = array of TIntArray;

{ The number of values in the list that are at most Limit. }
function UpperBound(const Values: TIntArray; Limit: Int64): Integer;
var
  Lo, Hi, Mid: Integer;
begin
  Lo := 0;
  Hi := Length(Values);
  while Lo < Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    if Values[Mid] <= Limit then
      Lo := Mid + 1
    else
      Hi := Mid;
  end;
  Result := Lo;
end;

{ The number of positions in [Left, Right) whose value is at most Limit. }
function CountAtMost(const Tree: TTree; Size, Left, Right: Integer; Limit: Int64): Int64;
var
  L, R: Integer;
begin
  Result := 0;
  L := Left + Size;
  R := Right + Size;
  while L < R do
  begin
    if (L and 1) <> 0 then
    begin
      Result := Result + UpperBound(Tree[L], Limit);
      Inc(L);
    end;
    if (R and 1) <> 0 then
    begin
      Dec(R);
      Result := Result + UpperBound(Tree[R], Limit);
    end;
    L := L shr 1;
    R := R shr 1;
  end;
end;

var
  N, Q, Size, I, J, L, R, LLen, RLen: Integer;
  Values: TIntArray;
  Tree: TTree;
  Minimum, Maximum, LowValue, HighValue, MidValue, K: Int64;

begin
  Read(N);
  Read(Q);
  if N <= 0 then
    Exit;

  SetLength(Values, N);
  for I := 0 to N - 1 do
    Read(Values[I]);

  Minimum := Values[0];
  Maximum := Values[0];
  for I := 1 to N - 1 do
  begin
    if Values[I] < Minimum then
      Minimum := Values[I];
    if Values[I] > Maximum then
      Maximum := Values[I];
  end;

  Size := 1;
  while Size < N do
    Size := Size * 2;

  SetLength(Tree, 2 * Size);
  for I := 0 to N - 1 do
  begin
    SetLength(Tree[Size + I], 1);
    Tree[Size + I][0] := Values[I];
  end;

  { The merge step of merge sort, run once per internal node. }
  for I := Size - 1 downto 1 do
  begin
    LLen := Length(Tree[2 * I]);
    RLen := Length(Tree[2 * I + 1]);
    SetLength(Tree[I], LLen + RLen);
    L := 0;
    R := 0;
    J := 0;
    while (L < LLen) and (R < RLen) do
    begin
      if Tree[2 * I][L] <= Tree[2 * I + 1][R] then
      begin
        Tree[I][J] := Tree[2 * I][L];
        Inc(L);
      end
      else
      begin
        Tree[I][J] := Tree[2 * I + 1][R];
        Inc(R);
      end;
      Inc(J);
    end;
    while L < LLen do
    begin
      Tree[I][J] := Tree[2 * I][L];
      Inc(L);
      Inc(J);
    end;
    while R < RLen do
    begin
      Tree[I][J] := Tree[2 * I + 1][R];
      Inc(R);
      Inc(J);
    end;
  end;

  for I := 0 to Q - 1 do
  begin
    Read(L);
    Read(R);
    Read(K);

    { The least value whose rank in the range reaches K is the K-th smallest,
      and the rank is monotone in the value. }
    LowValue := Minimum;
    HighValue := Maximum;
    while LowValue < HighValue do
    begin
      MidValue := LowValue + (HighValue - LowValue) div 2;
      if CountAtMost(Tree, Size, L - 1, R, MidValue) >= K then
        HighValue := MidValue
      else
        LowValue := MidValue + 1;
    end;
    WriteLn(LowValue);
  end;
end.
