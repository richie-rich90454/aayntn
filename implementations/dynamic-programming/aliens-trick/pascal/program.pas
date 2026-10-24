{ Educational reference implementation: Pascal is not a USACO submission
  language. }

{ The aliens trick for splitting an array into exactly k contiguous groups.

  Input: n k, then n nonnegative integers.
  Output: the minimum possible sum of squared group sums.

  A group spanning prefix positions j + 1 .. i costs
  (Prefix[i] - Prefix[j])^2. Charging a penalty for every group removes the
  group count from the state, and a binary search over the penalty recovers the
  answer for exactly k groups. The inner DP is a line query evaluated by a
  Li Chao tree; on equal values the line with more groups wins. }

program AliensTrick;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TLine = record
    Slope: Int64;
    Intercept: Int64;
    Count: Integer;
    Present: Boolean;
  end;

var
  N: Integer;
  K: Integer;
  Prefix: array of Int64;
  Tree: array of TLine;
  PenaltyCount: Integer;

function Better(const A, B: TLine; X: Int64): Boolean;
var
  LeftValue: Int64;
  RightValue: Int64;
begin
  LeftValue := A.Slope * X + A.Intercept;
  RightValue := B.Slope * X + B.Intercept;
  if LeftValue <> RightValue then
    Result := LeftValue < RightValue
  else
    Result := A.Count > B.Count;
end;

procedure Insert(Node, Left, Right: Integer; Line: TLine);
var
  Mid: Integer;
  Previous: TLine;
begin
  if not Tree[Node].Present then
  begin
    Tree[Node] := Line;
    Tree[Node].Present := True;
    Exit;
  end;

  Mid := Left + (Right - Left) div 2;
  if Better(Line, Tree[Node], Prefix[Mid]) then
  begin
    Previous := Tree[Node];
    Tree[Node] := Line;
    Line := Previous;
  end;
  if Left = Right then
    Exit;

  if Better(Line, Tree[Node], Prefix[Left]) then
    Insert(2 * Node, Left, Mid, Line)
  else if Better(Line, Tree[Node], Prefix[Right]) then
    Insert(2 * Node + 1, Mid + 1, Right, Line);
end;

function Query(Index: Integer): TLine;
var
  Node: Integer;
  Left: Integer;
  Right: Integer;
  Mid: Integer;
  X: Int64;
  Best: TLine;
begin
  Node := 1;
  Left := 0;
  Right := N;
  X := Prefix[Index];
  Best.Slope := 0;
  Best.Intercept := 0;
  Best.Count := 0;
  Best.Present := False;

  while True do
  begin
    if Tree[Node].Present then
      if (not Best.Present) or Better(Tree[Node], Best, X) then
        Best := Tree[Node];
    if Left = Right then
      Break;
    Mid := Left + (Right - Left) div 2;
    if Index <= Mid then
    begin
      Node := 2 * Node;
      Right := Mid;
    end
    else
    begin
      Node := 2 * Node + 1;
      Left := Mid + 1;
    end;
  end;

  Result := Best;
end;

function Penalized(Penalty: Int64): Int64;
var
  I: Integer;
  Size: Integer;
  Line: TLine;
  Value: Int64;
  Count: Integer;
  X: Int64;
begin
  Size := 4 * (N + 1) + 8;
  SetLength(Tree, Size);
  for I := 0 to High(Tree) do
    Tree[I].Present := False;

  Line.Slope := 0;
  Line.Intercept := 0;
  Line.Count := 0;
  Line.Present := True;
  Insert(1, 0, N, Line);

  Value := 0;
  Count := 0;
  for I := 1 to N do
  begin
    Line := Query(I);
    X := Prefix[I];
    Value := Line.Slope * X + Line.Intercept + X * X + Penalty;
    Count := Line.Count + 1;
    Line.Slope := -2 * X;
    Line.Intercept := Value + X * X;
    Line.Count := Count;
    Line.Present := True;
    Insert(1, 0, N, Line);
  end;

  PenaltyCount := Count;
  Result := Value;
end;

var
  I: Integer;
  Value: Int64;
  Total: Int64;
  Low: Int64;
  High: Int64;
  Mid: Int64;
  Count: Integer;
  Answer: Int64;
begin
  N := 0;
  Read(N);
  K := 0;
  Read(K);

  if N <= 0 then
  begin
    WriteLn('0');
    Exit;
  end;
  if K < 1 then
    K := 1;
  if K > N then
    K := N;

  SetLength(Prefix, N + 1);
  Prefix[0] := 0;
  for I := 1 to N do
  begin
    Value := 0;
    Read(Value);
    Prefix[I] := Prefix[I - 1] + Value;
  end;

  Total := Prefix[N];
  Low := 0;
  High := Total * Total + 1;
  while Low < High do
  begin
    Mid := Low + (High - Low + 1) div 2;
    Penalized(Mid);
    Count := PenaltyCount;
    if Count >= K then
      Low := Mid
    else
      High := Mid - 1;
  end;

  Answer := Penalized(Low) - Low * K;
  WriteLn(IntToStr(Answer));
end.
