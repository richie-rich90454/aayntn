program minimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

type
  TIntArray = array of Integer;
  TInt64Array = array of Int64;
  TAdjList = array of TIntArray;

  { A heavy-light decomposition of a tree rooted at one vertex: Size[v] is the
    number of vertices in the subtree of v, Heavy[v] is the child of v with the
    largest subtree, Head[v] is the top of the chain of v and Pos[v] is its
    index in the flattened array.

    Ownership: the constructor allocates the tables and the destructor
    releases them, so the caller owns the instance and must free it exactly
    once. }
  THld = class
  private
    FN: Integer;
    FParent: TIntArray;
    FDepth: TIntArray;
    FSize: TIntArray;
    FHeavy: TIntArray;
    FHead: TIntArray;
    FPos: TIntArray;
    FFlat: TInt64Array;
    FPrefix: TInt64Array;
  public
    constructor Create(const Adj: TAdjList; Root: Integer; const Values: TInt64Array);
    destructor Destroy; override;
    function SubtreeSize(V: Integer): Integer;
    function HeavyChild(V: Integer): Integer;
    function ChainHead(V: Integer): Integer;
    function Position(V: Integer): Integer;
    function PathSum(U, V: Integer): Int64;
  end;

constructor THld.Create(const Adj: TAdjList; Root: Integer; const Values: TInt64Array);
var
  I: Integer;
  J: Integer;
  U: Integer;
  V: Integer;
  W: Integer;
  Order: TIntArray;
  Head: Integer;
  Tail: Integer;
  Timer: Integer;
begin
  inherited Create;
  FN := Length(Adj);
  SetLength(FParent, FN);
  SetLength(FDepth, FN);
  SetLength(FSize, FN);
  SetLength(FHeavy, FN);
  SetLength(FHead, FN);
  SetLength(FPos, FN);
  SetLength(FFlat, FN);
  SetLength(FPrefix, FN + 1);
  for I := 0 to FN - 1 do
  begin
    FDepth[I] := -1;
    FSize[I] := 1;
    FHeavy[I] := -1;
  end;
  if (FN <= 0) or (Root < 0) or (Root >= FN) then
    Exit;

  { A breadth-first walk from the root fixes the parents and the depths. }
  FParent[Root] := Root;
  FDepth[Root] := 0;
  SetLength(Order, FN);
  Head := 0;
  Tail := 0;
  Order[Tail] := Root;
  Inc(Tail);
  while Head < Tail do
  begin
    U := Order[Head];
    Inc(Head);
    for I := 0 to High(Adj[U]) do
    begin
      W := Adj[U][I];
      if FDepth[W] <> -1 then
        Continue;  { the vertex was already reached through another edge }
      FDepth[W] := FDepth[U] + 1;
      FParent[W] := U;
      Order[Tail] := W;
      Inc(Tail);
    end;
  end;

  { The subtree sizes are known from the leaves upwards, and the heavy child
    of a vertex is the child with the largest subtree. }
  for I := Tail - 1 downto 0 do
  begin
    U := Order[I];
    for J := 0 to High(Adj[U]) do
    begin
      W := Adj[U][J];
      if (W = U) or (FParent[W] <> U) then
        Continue;  { the vertex is not a child of U }
      FSize[U] := FSize[U] + FSize[W];
      if (FHeavy[U] = -1) or (FSize[W] > FSize[FHeavy[U]]) then
        FHeavy[U] := W;
    end;
  end;

  { The flattened array holds one chain after the other, so the vertices of a
    chain occupy a contiguous range of indices. }
  Timer := 0;
  for I := 0 to Tail - 1 do
  begin
    U := Order[I];
    if (U <> Root) and (FHeavy[FParent[U]] = U) then
      Continue;  { the vertex continues the chain of its parent }
    V := U;
    while V <> -1 do
    begin
      FHead[V] := U;
      FPos[V] := Timer;
      FFlat[Timer] := Values[V];
      Inc(Timer);
      V := FHeavy[V];
    end;
  end;

  { The prefix sums turn every chain segment into a single subtraction, so a
    path query costs one step per chain instead of a segment tree walk. }
  for I := 0 to FN - 1 do
    FPrefix[I + 1] := FPrefix[I] + FFlat[I];
end;

destructor THld.Destroy;
begin
  SetLength(FParent, 0);
  SetLength(FDepth, 0);
  SetLength(FSize, 0);
  SetLength(FHeavy, 0);
  SetLength(FHead, 0);
  SetLength(FPos, 0);
  SetLength(FFlat, 0);
  SetLength(FPrefix, 0);
  inherited Destroy;
end;

{ The number of vertices in the subtree of V. }
function THld.SubtreeSize(V: Integer): Integer;
begin
  if (V < 0) or (V >= FN) then
  begin
    Result := 0;
    Exit;
  end;
  Result := FSize[V];
end;

{ The child of V with the largest subtree, or -1 when V is a leaf. }
function THld.HeavyChild(V: Integer): Integer;
begin
  if (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  Result := FHeavy[V];
end;

{ The top of the chain of V. }
function THld.ChainHead(V: Integer): Integer;
begin
  if (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  Result := FHead[V];
end;

{ The index of V in the flattened array. }
function THld.Position(V: Integer): Integer;
begin
  if (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  Result := FPos[V];
end;

{ The sum of the values of the vertices on the path from U to V. }
function THld.PathSum(U, V: Integer): Int64;
var
  Total: Int64;
  Top: Integer;
  Swap: Integer;
begin
  if (U < 0) or (U >= FN) or (V < 0) or (V >= FN) then
  begin
    Result := 0;
    Exit;
  end;
  if (FDepth[U] < 0) or (FDepth[V] < 0) then
  begin
    { A vertex outside the component of the root lies on no path. }
    Result := 0;
    Exit;
  end;

  Total := 0;
  while FHead[U] <> FHead[V] do
  begin
    if FDepth[FHead[U]] < FDepth[FHead[V]] then
    begin
      Swap := U;
      U := V;
      V := Swap;
    end;
    { The chain of U is a contiguous range of the flattened array. }
    Top := FHead[U];
    Total := Total + (FPrefix[FPos[U] + 1] - FPrefix[FPos[Top]]);
    U := FParent[Top];
  end;
  if FDepth[U] > FDepth[V] then
  begin
    Swap := U;
    U := V;
    V := Swap;
  end;
  Total := Total + (FPrefix[FPos[V] + 1] - FPrefix[FPos[U]]);
  Result := Total;
end;

var
  Adj: TAdjList;
  Values: TInt64Array;
  Hld: THld;
begin
  { Self-check only: the class above is the reusable part, so this file asserts
    the documented contract instead of reading input. }
  { The tree 0-1, 1-2, 1-3 with the value of the vertex i equal to i + 1. }
  SetLength(Adj, 4);
  SetLength(Adj[0], 1);
  Adj[0][0] := 1;
  SetLength(Adj[1], 3);
  Adj[1][0] := 0;
  Adj[1][1] := 2;
  Adj[1][2] := 3;
  SetLength(Adj[2], 1);
  Adj[2][0] := 1;
  SetLength(Adj[3], 1);
  Adj[3][0] := 1;

  SetLength(Values, 4);
  Values[0] := 1;
  Values[1] := 2;
  Values[2] := 3;
  Values[3] := 4;

  Hld := THld.Create(Adj, 0, Values);

  if (Hld.SubtreeSize(0) <> 4) or (Hld.SubtreeSize(1) <> 3) then
    Halt(1);
  if (Hld.SubtreeSize(2) <> 1) or (Hld.SubtreeSize(3) <> 1) then
    Halt(1);
  if (Hld.HeavyChild(0) <> 1) or (Hld.HeavyChild(1) <> 2) then
    Halt(1);

  if Hld.PathSum(2, 3) <> 9 then
    Halt(1);
  if Hld.PathSum(0, 3) <> 7 then
    Halt(1);
  { The path of a vertex with itself holds that vertex alone. }
  if Hld.PathSum(0, 0) <> 1 then
    Halt(1);
  if Hld.PathSum(1, 1) <> 2 then
    Halt(1);

  Hld.Free;
end.
