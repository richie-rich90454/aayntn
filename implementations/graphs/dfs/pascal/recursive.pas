program recursive;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

{ Marks V as visited and recurses into the neighbours that are still
  unvisited. The frame of this call stays on the stack for as long as the
  subtree of V is explored, so the recursion depth equals the depth of the
  current path. }
procedure DfsVisit(const Adj: TAdjList; V: Integer; var Visited: array of Boolean;
  var Order: TIntArray; var Count: Integer);
var
  I: Integer;
  W: Integer;
begin
  Visited[V] := True;
  Order[Count] := V;
  Inc(Count);
  for I := 0 to High(Adj[V]) do
  begin
    W := Adj[V][I];
    if not Visited[W] then
      DfsVisit(Adj, W, Visited, Order, Count);
  end;
end;

{ Depth-first search that marks a vertex on entry to the recursive call.
  Every vertex is entered at most once, so the auxiliary space is the
  visited array plus one stack frame per vertex on the current path: O(V) in
  total. The call stack can grow to the depth of the graph. }
function DfsRecursive(const Adj: TAdjList; Source: Integer): TIntArray;
var
  Visited: array of Boolean;
  Order: TIntArray;
  Count: Integer;
  I: Integer;
begin
  { SetLength leaves a dynamic array of a simple type uninitialized, so the
    visited flags have to be cleared explicitly. }
  SetLength(Visited, Length(Adj));
  for I := 0 to High(Visited) do
    Visited[I] := False;
  SetLength(Order, Length(Adj));
  Count := 0;

  if (Source >= 0) and (Source < Length(Adj)) then
    DfsVisit(Adj, Source, Visited, Order, Count);

  Result := Copy(Order, 0, Count);
end;

var
  N: Integer;
  M: Integer;
  Source: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Adj: TAdjList;
  Order: TIntArray;
  Reachable: array of Boolean;
  Row: string;
begin
  { The input is exactly the contract: n, m, the m edges and the source. }
  N := 0;
  Read(N);
  if N < 0 then
    N := 0;
  M := 0;
  Read(M);

  SetLength(Adj, N);
  for I := 0 to N - 1 do
    SetLength(Adj[I], 0);

  for I := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    Read(U);
    Read(V);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    SetLength(Adj[U], Length(Adj[U]) + 1);
    Adj[U][High(Adj[U])] := V;
    SetLength(Adj[V], Length(Adj[V]) + 1);
    Adj[V][High(Adj[V])] := U;
  end;

  Source := 0;
  Read(Source);

  Order := DfsRecursive(Adj, Source);
  SetLength(Reachable, N);
  for I := 0 to N - 1 do
    Reachable[I] := False;
  for I := 0 to High(Order) do
    Reachable[Order[I]] := True;

  WriteLn(Length(Order));
  Row := '';
  for I := 0 to N - 1 do
    if Reachable[I] then
    begin
      if Row <> '' then
        Row := Row + ' ';
      Row := Row + IntToStr(I);
    end;
  WriteLn(Row);
end.
