program BipartiteTwoColoring;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

{ Colors one connected component at a time. A vertex receives the opposite
  color of the vertex that discovered it, so its color is the parity of its
  breadth-first distance from the root of its component. An edge that joins two
  vertices of the same color closes an odd cycle and makes the graph
  non-bipartite. }
var
  N: LongInt;
  M: LongInt;
  Head: array of LongInt;
  Color: array of LongInt;
  Destination: array of LongInt;
  NextEdge: array of LongInt;
  Queue: array of LongInt;
  EdgeCount: LongInt;
  I: LongInt;
  U: LongInt;
  V: LongInt;
  S: LongInt;
  Front: LongInt;
  Back: LongInt;
  Bipartite: Boolean;
  Line: string;
begin
  N := 0;
  M := 0;
  Read(N);
  Read(M);
  if N <= 0 then
  begin
    WriteLn;
    Halt(0);
  end;
  if M < 0 then
    M := 0;

  SetLength(Head, N);
  SetLength(Color, N);
  SetLength(Queue, N);
  SetLength(Destination, 2 * M);
  SetLength(NextEdge, 2 * M);
  for I := 0 to N - 1 do
  begin
    Head[I] := -1;
    Color[I] := -1;
  end;

  EdgeCount := 0;
  for I := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    Read(U);
    Read(V);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    Destination[EdgeCount] := V;
    NextEdge[EdgeCount] := Head[U];
    Head[U] := EdgeCount;
    Inc(EdgeCount);
    Destination[EdgeCount] := U;
    NextEdge[EdgeCount] := Head[V];
    Head[V] := EdgeCount;
    Inc(EdgeCount);
  end;

  Bipartite := True;
  S := 0;
  while (S < N) and Bipartite do
  begin
    if Color[S] <> -1 then
    begin
      Inc(S);
      Continue;
    end;
    Color[S] := 0;
    Front := 0;
    Back := 0;
    Queue[Back] := S;
    Inc(Back);
    while (Front < Back) and Bipartite do
    begin
      U := Queue[Front];
      Inc(Front);
      I := Head[U];
      while (I <> -1) and Bipartite do
      begin
        V := Destination[I];
        if Color[V] = -1 then
        begin
          Color[V] := Color[U] xor 1;
          Queue[Back] := V;
          Inc(Back);
        end
        else if Color[V] = Color[U] then
          { The edge closes an odd cycle. }
          Bipartite := False;
        I := NextEdge[I];
      end;
    end;
    Inc(S);
  end;

  if not Bipartite then
    WriteLn('-1')
  else
  begin
    Line := '';
    for I := 0 to N - 1 do
    begin
      if I > 0 then
        Line := Line + ' ';
      Line := Line + IntToStr(Color[I]);
    end;
    WriteLn(Line);
  end;
end.
