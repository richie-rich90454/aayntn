program minimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

type
  { A segment tree over a 1-indexed array of n values: Tree[node] holds the
    sum of the values of the range that the node covers, so every node caches
    the result of merging its two children.

    Ownership: the constructor allocates the tree and the destructor releases
    it, so the caller owns the instance and must free it exactly once. }
  TSegmentTree = class
  private
    FN: Integer;
    FTree: array of Int64;
    procedure Build(Node, Lo, Hi: Integer; const Values: array of Int64);
    procedure AssignAt(Node, Lo, Hi, Index: Integer; Value: Int64);
    function QueryAt(Node, Lo, Hi, Left, Right: Integer): Int64;
  public
    constructor Create(const Values: array of Int64);
    destructor Destroy; override;
    procedure SetValue(Index: Integer; Value: Int64);
    function RangeSum(Left, Right: Integer): Int64;
  end;

{ Fills the subtree of Node, which covers the positions Lo..Hi. }
procedure TSegmentTree.Build(Node, Lo, Hi: Integer; const Values: array of Int64);
var
  Mid: Integer;
begin
  if Lo = Hi then
  begin
    FTree[Node] := Values[Lo - 1];
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  Build(Node * 2, Lo, Mid, Values);
  Build(Node * 2 + 1, Mid + 1, Hi, Values);
  FTree[Node] := FTree[Node * 2] + FTree[Node * 2 + 1];
end;

{ Assigns the value at the 1-based Index inside the subtree of Node. }
procedure TSegmentTree.AssignAt(Node, Lo, Hi, Index: Integer; Value: Int64);
var
  Mid: Integer;
begin
  if Lo = Hi then
  begin
    FTree[Node] := Value;
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  if Index <= Mid then
    AssignAt(Node * 2, Lo, Mid, Index, Value)
  else
    AssignAt(Node * 2 + 1, Mid + 1, Hi, Index, Value);
  { Merging the two children restores the invariant of the node. }
  FTree[Node] := FTree[Node * 2] + FTree[Node * 2 + 1];
end;

{ The sum of the positions Left..Right inside the subtree of Node. }
function TSegmentTree.QueryAt(Node, Lo, Hi, Left, Right: Integer): Int64;
var
  Mid: Integer;
begin
  if (Right < Lo) or (Hi < Left) then
  begin
    { The queried range and the subtree do not overlap. }
    Result := 0;
    Exit;
  end;
  if (Left <= Lo) and (Hi <= Right) then
  begin
    Result := FTree[Node];
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  Result := QueryAt(Node * 2, Lo, Mid, Left, Right) +
            QueryAt(Node * 2 + 1, Mid + 1, Hi, Left, Right);
end;

constructor TSegmentTree.Create(const Values: array of Int64);
begin
  inherited Create;
  FN := Length(Values);
  { A binary tree over n leaves fits in 4n nodes when the root is the 1. }
  SetLength(FTree, 4 * FN + 4);
  FillChar(FTree[0], Length(FTree) * SizeOf(Int64), 0);
  if FN > 0 then
    Build(1, 1, FN, Values);
end;

destructor TSegmentTree.Destroy;
begin
  SetLength(FTree, 0);
  inherited Destroy;
end;

{ Assigns the value at the 1-based Index; an index outside 1..n is ignored. }
procedure TSegmentTree.SetValue(Index: Integer; Value: Int64);
begin
  if (Index < 1) or (Index > FN) then
    Exit;
  AssignAt(1, 1, FN, Index, Value);
end;

{ The sum of the positions Left..Right, both inclusive. }
function TSegmentTree.RangeSum(Left, Right: Integer): Int64;
begin
  if Left < 1 then
    Left := 1;
  if Right > FN then
    Right := FN;
  if Left > Right then
  begin
    Result := 0;
    Exit;
  end;
  Result := QueryAt(1, 1, FN, Left, Right);
end;

var
  Values: array[0..4] of Int64 = (1, 2, 3, 4, 5);
  Tree: TSegmentTree;
begin
  { Self-check only: the class above is the reusable part, so this file asserts
    the documented contract instead of reading input. }
  Tree := TSegmentTree.Create(Values);
  if Tree.RangeSum(1, 5) <> 15 then
    Halt(1);
  if Tree.RangeSum(2, 4) <> 9 then
    Halt(1);
  if Tree.RangeSum(3, 3) <> 3 then
    Halt(1);

  Tree.SetValue(3, 30);
  if Tree.RangeSum(1, 5) <> 42 then
    Halt(1);
  if Tree.RangeSum(3, 5) <> 39 then
    Halt(1);

  { A negative value is an ordinary value, and an empty range sums to 0. }
  Tree.SetValue(1, -10);
  if Tree.RangeSum(1, 5) <> 31 then
    Halt(1);
  if Tree.RangeSum(4, 2) <> 0 then
    Halt(1);

  { An index outside the array is ignored. }
  Tree.SetValue(9, 100);
  Tree.SetValue(0, 100);
  if Tree.RangeSum(1,  5) <> 31 then
    Halt(1);

  Tree.Free;
end.
