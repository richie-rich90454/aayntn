program LazyPropagationProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  { A lazy segment tree over a 1-indexed array of N positions, supporting
    range addition and range sum queries.

    Tree[Node] holds the sum of the node's range, and Lazy[Node] holds the
    addition that has already been applied to Tree[Node] but not yet to its
    children. The constructor allocates both arrays and the destructor releases
    them, so the caller owns the instance and must free it exactly once. }
  TLazySum = class
  private
    FN: Integer;
    FTree: array of Int64;
    FLazy: array of Int64;
    procedure Apply(Node, Lo, Hi: Integer; Delta: Int64);
    procedure Push(Node, Lo, Hi: Integer);
    procedure Add(Node, Lo, Hi, Left, Right: Integer; Delta: Int64);
    function Query(Node, Lo, Hi, Left, Right: Integer): Int64;
  public
    constructor Create(N: Integer);
    destructor Destroy; override;
    procedure RangeAdd(Left, Right: Integer; Delta: Int64);
    function RangeSum(Left, Right: Integer): Int64;
  end;

constructor TLazySum.Create(N: Integer);
var
  I: Integer;
begin
  inherited Create;
  if N < 0 then
    N := 0;
  FN := N;
  SetLength(FTree, 4 * N + 4);
  SetLength(FLazy, 4 * N + 4);
  for I := 0 to High(FTree) do
  begin
    FTree[I] := 0;
    FLazy[I] := 0;
  end;
end;

destructor TLazySum.Destroy;
begin
  SetLength(FTree, 0);
  SetLength(FLazy, 0);
  inherited Destroy;
end;

{ Applies Delta to every position in the node's range [Lo, Hi]. }
procedure TLazySum.Apply(Node, Lo, Hi: Integer; Delta: Int64);
begin
  FTree[Node] := FTree[Node] + Delta * (Hi - Lo + 1);
  FLazy[Node] := FLazy[Node] + Delta;
end;

{ Pushes the node's pending addition to its two children. }
procedure TLazySum.Push(Node, Lo, Hi: Integer);
var
  Mid: Integer;
begin
  if (FLazy[Node] = 0) or (Lo = Hi) then
    Exit;
  Mid := Lo + (Hi - Lo) div 2;
  Apply(Node * 2, Lo, Mid, FLazy[Node]);
  Apply(Node * 2 + 1, Mid + 1, Hi, FLazy[Node]);
  FLazy[Node] := 0;
end;

procedure TLazySum.Add(Node, Lo, Hi, Left, Right: Integer; Delta: Int64);
var
  Mid: Integer;
begin
  if (Right < Lo) or (Hi < Left) then
    Exit;
  if (Left <= Lo) and (Hi <= Right) then
  begin
    Apply(Node, Lo, Hi, Delta);
    Exit;
  end;
  Push(Node, Lo, Hi);
  Mid := Lo + (Hi - Lo) div 2;
  Add(Node * 2, Lo, Mid, Left, Right, Delta);
  Add(Node * 2 + 1, Mid + 1, Hi, Left, Right, Delta);
  FTree[Node] := FTree[Node * 2] + FTree[Node * 2 + 1];
end;

function TLazySum.Query(Node, Lo, Hi, Left, Right: Integer): Int64;
var
  Mid: Integer;
begin
  if (Right < Lo) or (Hi < Left) then
    Exit(0);
  if (Left <= Lo) and (Hi <= Right) then
    Exit(FTree[Node]);
  Push(Node, Lo, Hi);
  Mid := Lo + (Hi - Lo) div 2;
  Result := Query(Node * 2, Lo, Mid, Left, Right) +
            Query(Node * 2 + 1, Mid + 1, Hi, Left, Right);
end;

procedure TLazySum.RangeAdd(Left, Right: Integer; Delta: Int64);
begin
  if FN > 0 then
    Add(1, 1, FN, Left, Right, Delta);
end;

function TLazySum.RangeSum(Left, Right: Integer): Int64;
begin
  if FN = 0 then
    Exit(0);
  Result := Query(1, 1, FN, Left, Right);
end;

var
  N: Integer;
  Q: Integer;
  K: Integer;
  Kind: Integer;
  Left: Integer;
  Right: Integer;
  Delta: Int64;
  Tree: TLazySum;
begin
  N := 0;
  Q := 0;
  Read(N);
  Read(Q);

  Tree := TLazySum.Create(N);

  for K := 0 to Q - 1 do
  begin
    Kind := 0;
    Read(Kind);
    if Kind = 1 then
    begin
      Left := 0;
      Right := 0;
      Delta := 0;
      Read(Left);
      Read(Right);
      Read(Delta);
      Tree.RangeAdd(Left, Right, Delta);
    end
    else if Kind = 2 then
    begin
      Left := 0;
      Right := 0;
      Read(Left);
      Read(Right);
      WriteLn(IntToStr(Tree.RangeSum(Left, Right)));
    end
    else
      Break;
  end;

  Tree.Free;
end.
