program minimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  { A Fenwick tree (binary indexed tree) over a 1-indexed array: Tree[i] holds
    the sum of the positions in the block (i - lowbit(i), i], where lowbit(i)
    is the largest power of two that divides i.

    Ownership: the constructor allocates the tree and the destructor releases
    it, so the caller owns the instance and must free it exactly once. }
  TFenwick = class
  private
    FN: Integer;
    FTree: array of Int64;
  public
    constructor Create(N: Integer);
    destructor Destroy; override;
    procedure Add(Index: Integer; Delta: Int64);
    function PrefixSum(Index: Integer): Int64;
    function RangeSum(Left, Right: Integer): Int64;
  end;

constructor TFenwick.Create(N: Integer);
begin
  inherited Create;
  if N < 0 then
    N := 0;
  FN := N;
  SetLength(FTree, N + 1);
  FillChar(FTree[0], (N + 1) * SizeOf(Int64), 0);
end;

destructor TFenwick.Destroy;
begin
  SetLength(FTree, 0);
  inherited Destroy;
end;

{ Adds Delta to the value at the 1-based Index. }
procedure TFenwick.Add(Index: Integer; Delta: Int64);
var
  I: Integer;
begin
  if Index < 1 then
    Exit;
  { Stepping up by lowbit visits exactly the blocks that contain the index. }
  I := Index;
  while I <= FN do
  begin
    FTree[I] := FTree[I] + Delta;
    I := I + (I and (-I));
  end;
end;

{ The sum of the positions 1..Index. }
function TFenwick.PrefixSum(Index: Integer): Int64;
var
  I: Integer;
begin
  if Index > FN then
    Index := FN;
  Result := 0;
  { Stepping down by lowbit visits disjoint blocks that partition 1..Index. }
  I := Index;
  while I > 0 do
  begin
    Result := Result + FTree[I];
    I := I - (I and (-I));
  end;
end;

{ The sum of the positions Left..Right, both inclusive. }
function TFenwick.RangeSum(Left, Right: Integer): Int64;
begin
  Result := PrefixSum(Right) - PrefixSum(Left - 1);
end;

var
  Tree: TFenwick;
begin
  { Self-check only: the class above is the reusable part, so this file asserts
    the documented contract instead of reading input. }
  Tree := TFenwick.Create(5);
  Tree.Add(1, 5);
  Tree.Add(2, 3);
  if Tree.PrefixSum(2) <> 8 then
    Halt(1);
  if Tree.RangeSum(1, 2) <> 8 then
    Halt(1);
  if Tree.RangeSum(1, 5) <> 8 then
    Halt(1);
  if Tree.RangeSum(3, 5) <> 0 then
    Halt(1);

  { A negative delta removes value, and the empty prefix sums to zero. }
  Tree.Add(2, -3);
  if Tree.RangeSum(1, 5) <> 5 then
    Halt(1);
  if Tree.PrefixSum(0) <> 0 then
    Halt(1);

  Tree.Free;
end.
