program SegmentTreeProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TInt64Array = array of Int64;

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
var
  I: Integer;
begin
  inherited Create;
  FN := Length(Values);
  { A binary tree over n leaves fits in 4n nodes when the root is the 1. }
  SetLength(FTree, 4 * FN + 4);
  for I := 0 to High(FTree) do
    FTree[I] := 0;
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
  Values: TInt64Array;
  N: Integer;
  Q: Integer;
  K: Integer;
  I: Integer;
  Kind: Integer;
  A: Integer;
  B: Int64;
  Tree: TSegmentTree;
begin
  { The input is exactly the contract: n, q and the q operations. }
  N := 0;
  Read(N);
  Q := 0;
  Read(Q);

  { Every position starts at zero, because the input carries no values. }
  SetLength(Values, N);
  for I := 0 to N - 1 do
    Values[I] := 0;
  Tree := TSegmentTree.Create(Values);

  for K := 0 to Q - 1 do
  begin
    Kind := 0;
    Read(Kind);
    if (Kind <> 1) and (Kind <> 2) then
      Break;
    A := 0;
    B := 0;
    Read(A);
    Read(B);
    if Kind = 1 then
      Tree.SetValue(A, B)
    else
      WriteLn(IntToStr(Tree.RangeSum(A, B)));
  end;

  Tree.Free;
end.
