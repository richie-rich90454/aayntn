program minimal;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

{ Breadth-first search from Source over an unweighted graph. The queue holds
  the frontier, so the vertices leave it in order of increasing distance from
  Source: the first time a vertex is discovered its distance is already the
  length of a shortest path to it. }
function BfsDistances(const Adj: TAdjList; Source: Integer): TIntArray;
var
  Distance: TIntArray;
  Queue: TIntArray;
  Head: Integer;
  Tail: Integer;
  I: Integer;
  V: Integer;
  W: Integer;
begin
  SetLength(Distance, Length(Adj));
  for I := 0 to High(Distance) do
    Distance[I] := -1;

  if (Source < 0) or (Source >= Length(Adj)) then
  begin
    Result := Distance;
    Exit;
  end;

  SetLength(Queue, Length(Adj) + 1);
  Head := 0;
  Tail := 1;
  Queue[0] := Source;
  Distance[Source] := 0;

  while Head < Tail do
  begin
    V := Queue[Head];
    Inc(Head);
    for I := 0 to High(Adj[V]) do
    begin
      W := Adj[V][I];
      if Distance[W] >= 0 then
        Continue;
      Distance[W] := Distance[V] + 1;
      Queue[Tail] := W;
      Inc(Tail);
    end;
  end;

  Result := Distance;
end;

var
  N: Integer;
  M: Integer;
  Source: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Adj: TAdjList;
  Distance: TIntArray;
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

  Distance := BfsDistances(Adj, Source);

  Row := '';
  for I := 0 to N - 1 do
  begin
    if I > 0 then
      Row := Row + ' ';
    Row := Row + IntToStr(Distance[I]);
  end;
  WriteLn(Row);
end.
