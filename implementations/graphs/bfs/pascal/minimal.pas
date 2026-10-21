program minimal;
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
  Tokens: TTokens;
  N: Integer;
  M: Integer;
  Source: Integer;
  Index: Integer;
  I: Integer;
  U: Integer;
  V: Integer;
  Adj: TAdjList;
  Distance: TIntArray;
  Row: string;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  M := StrToIntDef(Tokens[1], 0);
  if N <= 0 then
  begin
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
