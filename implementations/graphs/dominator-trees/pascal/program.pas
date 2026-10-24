{ Educational reference implementation: Pascal is not a USACO submission language. }
program DominatorTrees;

{$mode objfpc}{$H+}
{$I-}

uses
  SysUtils;

type
  TIntArray = array of Integer;
  TAdjList = array of TIntArray;

{ The deepest common ancestor of A and B in the partially built dominator
  tree. Order[V] is the position of V in the reverse postorder, so an ancestor
  always has a smaller number than its descendants. The walk climbs the vertex
  with the larger number until the two meet. }
function Intersect(A, B: Integer; const Idoms, Order: TIntArray): Integer;
begin
  while A <> B do
  begin
    while Order[A] > Order[B] do
      A := Idoms[A];
    while Order[B] > Order[A] do
      B := Idoms[B];
  end;
  Result := A;
end;

{ The immediate dominator of every vertex, found with the iterative dataflow
  algorithm of Cooper, Harvey and Kennedy.

  Adj is the successor list and Pred the predecessor list. Idoms receives the
  immediate dominator of every vertex, -1 for the vertices the source cannot
  reach, and Source itself for the source. Order receives the
  reverse-postorder position of every vertex. }
procedure ImmediateDominators(const Adj, Pred: TAdjList; Source: Integer;
  var Idoms, Order: TIntArray);
var
  N, I, V, W, E, Candidate, Top, PostorderLength: Integer;
  Visited: array of Boolean;
  NextEdge, Postorder, Stack, Rpo: TIntArray;
  Changed: Boolean;
begin
  N := Length(Adj);
  SetLength(Idoms, N);
  SetLength(Order, N);
  for I := 0 to N - 1 do
  begin
    Idoms[I] := -1;
    Order[I] := -1;
  end;
  if (Source < 0) or (Source >= N) then
    Exit;

  { Iterative depth-first search. A vertex enters the postorder when its last
    successor has been examined, and the reverse of that order is the order
    the dominator computation needs. }
  SetLength(Visited, N);
  SetLength(NextEdge, N);
  SetLength(Postorder, N);
  SetLength(Stack, N);
  SetLength(Rpo, N);
  for I := 0 to N - 1 do
  begin
    Visited[I] := False;
    NextEdge[I] := 0;
  end;

  Top := 0;
  PostorderLength := 0;
  Visited[Source] := True;
  Stack[Top] := Source;
  Inc(Top);
  while Top > 0 do
  begin
    V := Stack[Top - 1];
    if NextEdge[V] < Length(Adj[V]) then
    begin
      W := Adj[V][NextEdge[V]];
      Inc(NextEdge[V]);
      if not Visited[W] then
      begin
        Visited[W] := True;
        Stack[Top] := W;
        Inc(Top);
      end;
    end
    else
    begin
      Postorder[PostorderLength] := V;
      Inc(PostorderLength);
      Dec(Top);
    end;
  end;

  for I := 0 to PostorderLength - 1 do
  begin
    Rpo[I] := Postorder[PostorderLength - 1 - I];
    Order[Rpo[I]] := I;
  end;

  Idoms[Source] := Source;
  Changed := True;
  while Changed do
  begin
    Changed := False;
    for I := 1 to PostorderLength - 1 do
    begin
      V := Rpo[I];
      Candidate := -1;
      for E := 0 to Length(Pred[V]) - 1 do
      begin
        W := Pred[V][E];
        if Idoms[W] = -1 then
          Continue;  { the predecessor is not reachable from the source }
        if Candidate = -1 then
          Candidate := W
        else
          Candidate := Intersect(W, Candidate, Idoms, Order);
      end;
      if (Candidate <> -1) and (Idoms[V] <> Candidate) then
      begin
        Idoms[V] := Candidate;
        Changed := True;
      end;
    end;
  end;
end;

var
  N, M, I, U, V, Source: Integer;
  Adj, Pred: TAdjList;
  Idoms, Order: TIntArray;
  Row: string;
begin
  N := 0;
  M := 0;
  Source := -1;
  Read(N);
  Read(M);
  Read(Source);
  if N <= 0 then
  begin
    WriteLn('');
    Exit;
  end;
  if M < 0 then
    M := 0;

  SetLength(Adj, N);
  SetLength(Pred, N);
  for I := 0 to N - 1 do
  begin
    SetLength(Adj[I], 0);
    SetLength(Pred[I], 0);
  end;

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
    SetLength(Pred[V], Length(Pred[V]) + 1);
    Pred[V][High(Pred[V])] := U;
  end;

  ImmediateDominators(Adj, Pred, Source, Idoms, Order);

  Row := '';
  for I := 0 to N - 1 do
  begin
    if I > 0 then
      Row := Row + ' ';
    if I = Source then
      Row := Row + '0'
    else
      Row := Row + IntToStr(Idoms[I]);
  end;
  WriteLn(Row);
end.
