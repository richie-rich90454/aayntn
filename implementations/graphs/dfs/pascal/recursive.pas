program recursive;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;
  TTokens = array of string;

{ Reads the whole standard input so that the tokens can be split without
  depending on where the line breaks fall. }
function ReadAllInput: string;
var
  Row: string;
begin
  Result := '';
  while not EOF(Input) do
  begin
    ReadLn(Row);
    Result := Result + Row + ' ';
  end;
end;

function Tokenize(const Content: string): TTokens;
var
  I: Integer;
  Start: Integer;
begin
  SetLength(Result, 0);
  I := 1;
  while I <= Length(Content) do
  begin
    while (I <= Length(Content)) and (Content[I] <= ' ') do
      Inc(I);
    if I > Length(Content) then
      Break;
    Start := I;
    while (I <= Length(Content)) and (Content[I] > ' ') do
      Inc(I);
    SetLength(Result, Length(Result) + 1);
    Result[High(Result)] := Copy(Content, Start, I - Start);
  end;
end;

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
  { SetLength leaves a dynamic array of a simple type uninitialised, so the
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
  Tokens: TTokens;
  N: Integer;
  M: Integer;
  Source: Integer;
  Index: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Adj: TAdjList;
  Order: TIntArray;
  Reachable: array of Boolean;
  Row: string;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  M := StrToIntDef(Tokens[1], 0);
  if N <= 0 then
  begin
    WriteLn('0');
    WriteLn('');
    Halt(0);
  end;

  SetLength(Adj, N);
  for I := 0 to N - 1 do
    SetLength(Adj[I], 0);

  Index := 2;
  for I := 0 to M - 1 do
  begin
    if Index >= Length(Tokens) then
      Break;
    U := StrToIntDef(Tokens[Index], -1);
    Inc(Index);
    if Index >= Length(Tokens) then
      Break;
    V := StrToIntDef(Tokens[Index], -1);
    Inc(Index);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    SetLength(Adj[U], Length(Adj[U]) + 1);
    Adj[U][High(Adj[U])] := V;
    SetLength(Adj[V], Length(Adj[V]) + 1);
    Adj[V][High(Adj[V])] := U;
  end;

  Source := -1;
  if Index < Length(Tokens) then
    Source := StrToIntDef(Tokens[Index], -1);

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
