program DfsProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

function TotalDegree(const Adj: TAdjList): Integer;
var
  I: Integer;
begin
  Result := 0;
  for I := 0 to High(Adj) do
    Inc(Result, Length(Adj[I]));
end;

{ Depth-first search over an unweighted graph: the stack replaces the call
  stack, so a chain of any length is traversed without recursion. }
function DfsReachable(const Adj: TAdjList; Source: Integer): TIntArray;
var
  Visited: array of Boolean;
  Stack: TIntArray;
  Order: TIntArray;
  Top: Integer;
  Count: Integer;
  I: Integer;
  V: Integer;
  W: Integer;
begin
  SetLength(Visited, Length(Adj));
  for I := 0 to High(Visited) do
    Visited[I] := False;
  SetLength(Order, Length(Adj));
  Count := 0;

  if (Source < 0) or (Source >= Length(Adj)) then
  begin
    Result := Copy(Order, 0, 0);
    Exit;
  end;

  { One slot per possible push: the source plus one per edge end. }
  SetLength(Stack, 1 + TotalDegree(Adj));
  Top := 1;
  Stack[0] := Source;

  while Top > 0 do
  begin
    Dec(Top);
    V := Stack[Top];
    if Visited[V] then
      Continue;
    Visited[V] := True;
    Order[Count] := V;
    Inc(Count);
    for I := 0 to High(Adj[V]) do
    begin
      W := Adj[V][I];
      if not Visited[W] then
      begin
        Stack[Top] := W;
        Inc(Top);
      end;
    end;
  end;

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

  Order := DfsReachable(Adj, Source);
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
