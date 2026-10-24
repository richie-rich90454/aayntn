{ Educational reference implementation: Pascal is not a USACO submission language. }
program SegmentTreeBeatsProgram;
{$mode objfpc}{$H+}

{
  Segment tree beats over a 1-indexed array of N positions, supporting range
  chmin and range sum queries.

  Every node stores its sum, its largest value, the second largest distinct
  value, and how many positions hold the largest value. A chmin that lands
  strictly between the two largest values changes only the largest group, so
  the node can absorb it in constant time; anything deeper has to descend.

  Input: N Q, then the N values, then Q lines "1 L R X" (cap every position in
  [L, R] at X) or "2 L R" (print the sum over [L, R]). Output: one line per
  query.
}

uses
  SysUtils;

type
  TInt64Array = array of Int64;
  TInt32Array = array of LongInt;

  TBeatsTree = class
  private
    FN: LongInt;
    FSum: TInt64Array;
    FMax1: TInt64Array;
    FMax2: TInt64Array;
    FCount: TInt32Array;
    procedure Pull(Node: LongInt);
    procedure ApplyCap(Node: LongInt; X: Int64);
    procedure Push(Node: LongInt);
    procedure Build(Node, Lo, Hi: LongInt; const Values: TInt64Array);
    procedure Cap(Node, Lo, Hi, Left, Right: LongInt; X: Int64);
    function Query(Node, Lo, Hi, Left, Right: LongInt): Int64;
  public
    constructor Create(N: LongInt; const Values: TInt64Array);
    destructor Destroy; override;
    procedure RangeChmin(Left, Right: LongInt; X: Int64);
    function RangeSum(Left, Right: LongInt): Int64;
  end;

function Max64(A, B: Int64): Int64;
begin
  if A > B then
    Result := A
  else
    Result := B;
end;

constructor TBeatsTree.Create(N: LongInt; const Values: TInt64Array);
var
  I: LongInt;
begin
  inherited Create;
  if N < 0 then
    N := 0;
  FN := N;
  SetLength(FSum, 4 * N + 4);
  SetLength(FMax1, 4 * N + 4);
  SetLength(FMax2, 4 * N + 4);
  SetLength(FCount, 4 * N + 4);
  for I := 0 to High(FSum) do
  begin
    FSum[I] := 0;
    FMax1[I] := 0;
    FMax2[I] := -1;
    FCount[I] := 0;
  end;
  if FN > 0 then
    Build(1, 1, FN, Values);
end;

destructor TBeatsTree.Destroy;
begin
  SetLength(FSum, 0);
  SetLength(FMax1, 0);
  SetLength(FMax2, 0);
  SetLength(FCount, 0);
  inherited Destroy;
end;

procedure TBeatsTree.Pull(Node: LongInt);
var
  Left, Right: LongInt;
begin
  Left := Node * 2;
  Right := Left + 1;
  FSum[Node] := FSum[Left] + FSum[Right];
  if FMax1[Left] = FMax1[Right] then
  begin
    FMax1[Node] := FMax1[Left];
    FCount[Node] := FCount[Left] + FCount[Right];
    FMax2[Node] := Max64(FMax2[Left], FMax2[Right]);
  end
  else if FMax1[Left] > FMax1[Right] then
  begin
    FMax1[Node] := FMax1[Left];
    FCount[Node] := FCount[Left];
    FMax2[Node] := Max64(FMax2[Left], FMax1[Right]);
  end
  else
  begin
    FMax1[Node] := FMax1[Right];
    FCount[Node] := FCount[Right];
    FMax2[Node] := Max64(FMax1[Left], FMax2[Right]);
  end;
end;

{ Caps the node's maximum at X. The caller guarantees FMax2 < X < FMax1, so
  exactly the positions holding the maximum change. }
procedure TBeatsTree.ApplyCap(Node: LongInt; X: Int64);
begin
  if FMax1[Node] <= X then
    Exit;
  FSum[Node] := FSum[Node] - (FMax1[Node] - X) * Int64(FCount[Node]);
  FMax1[Node] := X;
end;

{ Passes a cap that is already included in the node's aggregates down to its
  two children. The child's second maximum is at most the parent's second
  maximum, which the stored cap exceeded, so the child absorbs it at once. }
procedure TBeatsTree.Push(Node: LongInt);
begin
  ApplyCap(Node * 2, FMax1[Node]);
  ApplyCap(Node * 2 + 1, FMax1[Node]);
end;

procedure TBeatsTree.Build(Node, Lo, Hi: LongInt; const Values: TInt64Array);
var
  Mid: LongInt;
begin
  if Lo = Hi then
  begin
    FSum[Node] := Values[Lo];
    FMax1[Node] := Values[Lo];
    FMax2[Node] := -1;
    FCount[Node] := 1;
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  Build(Node * 2, Lo, Mid, Values);
  Build(Node * 2 + 1, Mid + 1, Hi, Values);
  Pull(Node);
end;

procedure TBeatsTree.Cap(Node, Lo, Hi, Left, Right: LongInt; X: Int64);
var
  Mid: LongInt;
begin
  if (Right < Lo) or (Hi < Left) or (FMax1[Node] <= X) then
    Exit;
  if (Left <= Lo) and (Hi <= Right) and (FMax2[Node] < X) then
  begin
    ApplyCap(Node, X);
    Exit;
  end;
  if Lo = Hi then
  begin
    ApplyCap(Node, X);
    Exit;
  end;
  Push(Node);
  Mid := Lo + (Hi - Lo) div 2;
  Cap(Node * 2, Lo, Mid, Left, Right, X);
  Cap(Node * 2 + 1, Mid + 1, Hi, Left, Right, X);
  Pull(Node);
end;

function TBeatsTree.Query(Node, Lo, Hi, Left, Right: LongInt): Int64;
var
  Mid: LongInt;
begin
  if (Right < Lo) or (Hi < Left) then
    Exit(0);
  if (Left <= Lo) and (Hi <= Right) then
    Exit(FSum[Node]);
  Push(Node);
  Mid := Lo + (Hi - Lo) div 2;
  Result := Query(Node * 2, Lo, Mid, Left, Right) +
            Query(Node * 2 + 1, Mid + 1, Hi, Left, Right);
end;

procedure TBeatsTree.RangeChmin(Left, Right: LongInt; X: Int64);
begin
  if FN > 0 then
    Cap(1, 1, FN, Left, Right, X);
end;

function TBeatsTree.RangeSum(Left, Right: LongInt): Int64;
begin
  if FN = 0 then
    Exit(0);
  Result := Query(1, 1, FN, Left, Right);
end;

var
  N, Q, I, Kind, Left, Right: LongInt;
  X: Int64;
  Values: TInt64Array;
  Tree: TBeatsTree;
begin
  N := 0;
  Q := 0;
  Read(N);
  Read(Q);
  if N <= 0 then
    Exit;

  SetLength(Values, N + 1);
  for I := 1 to N do
    Read(Values[I]);

  Tree := TBeatsTree.Create(N, Values);

  for I := 0 to Q - 1 do
  begin
    Kind := 0;
    Read(Kind);
    if Kind = 1 then
    begin
      Left := 0;
      Right := 0;
      X := 0;
      Read(Left);
      Read(Right);
      Read(X);
      Tree.RangeChmin(Left, Right, X);
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
