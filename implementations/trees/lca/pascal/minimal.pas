program minimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

  { A binary-lifting table for a tree rooted at one vertex: Up[k * n + v] is
    the ancestor of v that lies 2^k edges above it, and Depth[v] is the number
    of edges from the root to v.

    Ownership: the constructor allocates the tables and the destructor
    releases them, so the caller owns the instance and must free it exactly
    once. }
  TLca = class
  private
    FN: Integer;
    FLevels: Integer;
    FDepth: TIntArray;
    FUp: TIntArray;
  public
    constructor Create(const Adj: TAdjList; Root: Integer);
    destructor Destroy; override;
    function Lift(V, K: Integer): Integer;
    function DepthOf(V: Integer): Integer;
    function Query(U, V: Integer): Integer;
  end;

constructor TLca.Create(const Adj: TAdjList; Root: Integer);
var
  I: Integer;
  Levels: Integer;
  Queue: TIntArray;
  Head: Integer;
  Tail: Integer;
  U: Integer;
  W: Integer;
  K: Integer;
  V: Integer;
  Middle: Integer;
begin
  inherited Create;
  FN := Length(Adj);
  Levels := 1;
  while (1 shl Levels) <= FN do
    Inc(Levels);
  FLevels := Levels;
  SetLength(FDepth, FN);
  for I := 0 to FN - 1 do
    FDepth[I] := -1;
  SetLength(FUp, Levels * FN);
  { The root is its own ancestor, so every entry of the table is defined. }
  for I := 0 to Levels * FN - 1 do
    FUp[I] := Root;

  if (FN <= 0) or (Root < 0) or (Root >= FN) then
    Exit;

  { The root is its own ancestor, so the table stays defined everywhere. }
  FUp[Root] := Root;
  FDepth[Root] := 0;

  SetLength(Queue, FN);
  Head := 0;
  Tail := 0;
  Queue[Tail] := Root;
  Inc(Tail);
  while Head < Tail do
  begin
    U := Queue[Head];
    Inc(Head);
    for I := 0 to High(Adj[U]) do
    begin
      W := Adj[U][I];
      if FDepth[W] <> -1 then
        Continue;  { the vertex was already reached through another edge }
      FDepth[W] := FDepth[U] + 1;
      FUp[W] := U;
      Queue[Tail] := W;
      Inc(Tail);
    end;
  end;

  { The table of the 2^k ancestors is built from the table of the 2^(k-1). }
  for K := 1 to Levels - 1 do
    for V := 0 to FN - 1 do
    begin
      Middle := FUp[(K - 1) * FN + V];
      FUp[K * FN + V] := FUp[(K - 1) * FN + Middle];
    end;
end;

destructor TLca.Destroy;
begin
  SetLength(FDepth, 0);
  SetLength(FUp, 0);
  inherited Destroy;
end;

{ The ancestor of V that lies 2^k edges above it. }
function TLca.Lift(V, K: Integer): Integer;
begin
  if (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  if K < 0 then
    K := 0;
  if K >= FLevels then
    K := FLevels - 1;
  Result := FUp[K * FN + V];
end;

{ The number of edges from the root to V. }
function TLca.DepthOf(V: Integer): Integer;
begin
  if (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  Result := FDepth[V];
end;

{ The lowest common ancestor of U and V. }
function TLca.Query(U, V: Integer): Integer;
var
  Difference: Integer;
  K: Integer;
  AncestorU: Integer;
  AncestorV: Integer;
  Swap: Integer;
begin
  if (U < 0) or (U >= FN) or (V < 0) or (V >= FN) then
  begin
    Result := -1;
    Exit;
  end;
  if (FDepth[U] < 0) or (FDepth[V] < 0) then
  begin
    { A vertex outside the component of the root has no ancestor. }
    Result := -1;
    Exit;
  end;
  if FDepth[U] < FDepth[V] then
  begin
    Swap := U;
    U := V;
    V := Swap;
  end;

  { Lift the deeper vertex until both stand at the same depth. }
  Difference := FDepth[U] - FDepth[V];
  for K := 0 to FLevels - 1 do
    if ((Difference shr K) and 1) <> 0 then
      U := FUp[K * FN + U];
  if U = V then
  begin
    Result := U;
    Exit;
  end;

  { From the largest jump downwards, the two vertices either stay together or
    they both move one step below the common ancestor. }
  for K := FLevels - 1 downto 0 do
  begin
    AncestorU := FUp[K * FN + U];
    AncestorV := FUp[K * FN + V];
    if AncestorU <> AncestorV then
    begin
      U := AncestorU;
      V := AncestorV;
    end;
  end;
  Result := FUp[U];
end;

var
  Adj: TAdjList;
  Lca: TLca;
begin
  { Self-check only: the class above is the reusable part, so this file asserts
    the documented contract instead of reading input. }
  SetLength(Adj, 5);
  SetLength(Adj[0], 2);
  Adj[0][0] := 1;
  Adj[0][1] := 2;
  SetLength(Adj[1], 3);
  Adj[1][0] := 0;
  Adj[1][1] := 3;
  Adj[1][2] := 4;
  SetLength(Adj[2], 1);
  Adj[2][0] := 0;
  SetLength(Adj[3], 1);
  Adj[3][0] := 1;
  SetLength(Adj[4], 1);
  Adj[4][0] := 1;

  Lca := TLca.Create(Adj, 0);

  if Lca.Query(3, 4) <> 1 then
    Halt(1);
  if Lca.Query(2, 3) <> 0 then
    Halt(1);
  if Lca.Query(0, 4) <> 0 then
    Halt(1);
  { A vertex is its own lowest common ancestor. }
  if Lca.Query(3, 3) <> 3 then
    Halt(1);

  if (Lca.DepthOf(0) <> 0) or (Lca.DepthOf(1) <> 1) or (Lca.DepthOf(3) <> 2) then
    Halt(1);
  if (Lca.Lift(3, 0) <> 1) or (Lca.Lift(3, 1) <> 0) then
    Halt(1);

  Lca.Free;
end.
