program DijkstraProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TWeightedEdge = record
    Vertex: Integer;
    Weight: Int64;
  end;
  TEdgeArray = array of TWeightedEdge;
  TAdjList = array of TEdgeArray;
  TInt64Array = array of Int64;

  { A binary min-heap of (distance, vertex) pairs ordered by distance. Ties are
    broken by the heap layout, which cannot change the result: the shortest
    distance of a vertex is unique. }
  THeapEntry = record
    Distance: Int64;
    Vertex: Integer;
  end;
  TMinHeap = array of THeapEntry;

{ Appends an undirected edge to the adjacency list. }
procedure AddEdge(var Adj: TAdjList; U, V: Integer; Weight: Int64);
begin
  SetLength(Adj[U], Length(Adj[U]) + 1);
  Adj[U][High(Adj[U])].Vertex := V;
  Adj[U][High(Adj[U])].Weight := Weight;
  SetLength(Adj[V], Length(Adj[V]) + 1);
  Adj[V][High(Adj[V])].Vertex := U;
  Adj[V][High(Adj[V])].Weight := Weight;
end;

{ Adds an entry, growing the heap when it is full. }
procedure HeapPush(var Heap: TMinHeap; Distance: Int64; Vertex: Integer);
var
  Index: Integer;
  Parent: Integer;
  Temp: THeapEntry;
begin
  SetLength(Heap, Length(Heap) + 1);
  Index := High(Heap);
  Heap[Index].Distance := Distance;
  Heap[Index].Vertex := Vertex;
  while Index > 0 do
  begin
    Parent := (Index - 1) div 2;
    if Heap[Parent].Distance <= Heap[Index].Distance then
      Break;
    Temp := Heap[Parent];
    Heap[Parent] := Heap[Index];
    Heap[Index] := Temp;
    Index := Parent;
  end;
end;

{ Removes the smallest entry and reports it through Entry. }
function HeapPopMin(var Heap: TMinHeap; var Entry: THeapEntry): Boolean;
var
  Index: Integer;
  Child: Integer;
  Temp: THeapEntry;
begin
  Result := Length(Heap) > 0;
  if not Result then
    Exit;
  Entry := Heap[0];
  SetLength(Heap, Length(Heap) - 1);
  if Length(Heap) = 0 then
    Exit;
  Heap[0] := Heap[High(Heap)];
  Index := 0;
  while True do
  begin
    Child := 2 * Index + 1;
    if Child > High(Heap) then
      Break;
    if (Child < High(Heap)) and (Heap[Child + 1].Distance < Heap[Child].Distance) then
      Inc(Child);
    if Heap[Index].Distance <= Heap[Child].Distance then
      Break;
    Temp := Heap[Index];
    Heap[Index] := Heap[Child];
    Heap[Child] := Temp;
    Index := Child;
  end;
end;

{ Dijkstra's algorithm from Source over a graph whose edge weights are all
  nonnegative.

  The heap holds (distance, vertex) pairs and an entry is never removed from
  the middle of the heap: a shorter path to a vertex pushes a second entry and
  the stale one is discarded when it surfaces. That replaces a decrease-key
  operation by at most one extra entry per successful relaxation, so the heap
  holds O(E) entries.

  The result holds the distance from Source to every vertex and -1 for the
  vertices Source cannot reach. }
function DijkstraDistances(const Adj: TAdjList; Source: Integer): TInt64Array;
var
  Distance: TInt64Array;
  Heap: TMinHeap;
  Entry: THeapEntry;
  I: Integer;
  W: Integer;
  Candidate: Int64;
begin
  SetLength(Distance, Length(Adj));
  for I := 0 to High(Distance) do
    Distance[I] := -1;

  if (Source < 0) or (Source >= Length(Adj)) then
  begin
    Result := Distance;
    Exit;
  end;

  SetLength(Heap, 0);
  HeapPush(Heap, 0, Source);
  Distance[Source] := 0;

  while HeapPopMin(Heap, Entry) do
  begin
    if Entry.Distance <> Distance[Entry.Vertex] then
      Continue;  { a shorter path was found after this entry was pushed }
    for I := 0 to High(Adj[Entry.Vertex]) do
    begin
      W := Adj[Entry.Vertex][I].Vertex;
      Candidate := Entry.Distance + Adj[Entry.Vertex][I].Weight;
      if (Distance[W] >= 0) and (Candidate >= Distance[W]) then
        Continue;  { the relaxation would not improve the distance }
      Distance[W] := Candidate;
      HeapPush(Heap, Candidate, W);
    end;
  end;

  Result := Distance;
end;

var
  N: Integer;
  M: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  W: Int64;
  Source: Integer;
  Adj: TAdjList;
  Distance: TInt64Array;
  Row: string;
begin
  { The input is exactly the contract: n, m, the m weighted edges and the
    source. }
  N := 0;
  Read(N);
  if N < 0 then
    N := 0;
  M := 0;
  Read(M);
  if M < 0 then
    M := 0;

  SetLength(Adj, N);
  for I := 0 to N - 1 do
    SetLength(Adj[I], 0);

  for I := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    W := 0;
    Read(U);
    Read(V);
    Read(W);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) or (W < 0) then
      Continue;
    AddEdge(Adj, U, V, W);
  end;

  Source := 0;
  Read(Source);

  Distance := DijkstraDistances(Adj, Source);

  Row := '';
  for I := 0 to N - 1 do
  begin
    if I > 0 then
      Row := Row + ' ';
    Row := Row + IntToStr(Distance[I]);
  end;
  WriteLn(Row);
end.
