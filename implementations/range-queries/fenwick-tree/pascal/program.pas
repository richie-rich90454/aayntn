program FenwickProgram;
{$mode objfpc}{$H+}
{$I-}
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
var
  I: Integer;
begin
  inherited Create;
  if N < 0 then
    N := 0;
  FN := N;
  SetLength(FTree, N + 1);
  for I := 0 to N do
    FTree[I] := 0;
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
  N: Integer;
  Q: Integer;
  K: Integer;
  Kind: Integer;
  A: Integer;
  B: Int64;
  Tree: TFenwick;
begin
  { The input is exactly the contract: n, q and the q operations. }
  N := 0;
  Read(N);
  Q := 0;
  Read(Q);

  Tree := TFenwick.Create(N);

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
      Tree.Add(A, B)
    else
      WriteLn(IntToStr(Tree.RangeSum(A, B)));
  end;

  Tree.Free;
end.
