{ Educational reference implementation: Pascal is not a USACO submission language. }
program IterativeDeepening;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, M, StartVertex, TargetVertex: Integer;
  Head, Tail, Destination, NextEdge, OnPath: array of Integer;
  EdgeCount: Integer;
  Expanded: Int64;

procedure AddEdge(FromVertex, ToVertex: Integer);
begin
  Destination[EdgeCount] := ToVertex;
  NextEdge[EdgeCount] := -1;
  if Head[FromVertex] = -1 then
    Head[FromVertex] := EdgeCount
  else
    NextEdge[Tail[FromVertex]] := EdgeCount;
  Tail[FromVertex] := EdgeCount;
  EdgeCount := EdgeCount + 1;
end;

function DepthLimitedSearch(Vertex, Depth, Limit: Integer): Boolean;
var
  Edge, Neighbor: Integer;
begin
  OnPath[Vertex] := 1;
  Expanded := Expanded + 1;
  if Vertex = TargetVertex then
  begin
    Result := True;
    Exit;
  end;
  if Depth = Limit then
  begin
    OnPath[Vertex] := 0;
    Result := False;
    Exit;
  end;
  Edge := Head[Vertex];
  while Edge <> -1 do
  begin
    Neighbor := Destination[Edge];
    if (OnPath[Neighbor] = 0) and DepthLimitedSearch(Neighbor, Depth + 1, Limit) then
    begin
      Result := True;
      Exit;
    end;
    Edge := NextEdge[Edge];
  end;
  OnPath[Vertex] := 0;
  Result := False;
end;

var
  I, Limit, Answer, U, V: Integer;

begin
  Read(N);
  Read(M);
  Read(StartVertex);
  Read(TargetVertex);

  SetLength(Head, N + 1);
  SetLength(Tail, N + 1);
  SetLength(OnPath, N + 1);
  for I := 1 to N do
  begin
    Head[I] := -1;
    Tail[I] := -1;
  end;
  SetLength(Destination, 2 * M);
  SetLength(NextEdge, 2 * M);

  EdgeCount := 0;
  for I := 0 to M - 1 do
  begin
    Read(U);
    Read(V);
    AddEdge(U, V);
    AddEdge(V, U);
  end;

  Answer := -1;
  Expanded := 0;
  for Limit := 0 to N - 1 do
  begin
    for I := 0 to N do
      OnPath[I] := 0;
    if DepthLimitedSearch(StartVertex, 0, Limit) then
    begin
      Answer := Limit;
      Break;
    end;
  end;

  WriteLn(IntToStr(Answer) + ' ' + IntToStr(Expanded));
end.
