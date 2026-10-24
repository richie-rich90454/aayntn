{ Educational reference implementation: Pascal is not a USACO submission language. }
program LiChaoProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TOperation = record
    Kind: Integer;
    M: Int64;
    B: Int64;
    X: Int64;
  end;

  TOperationArray = array of TOperation;
  TCoordinateArray = array of Int64;

  TLine = record
    M: Int64;
    B: Int64;
    Used: Boolean;
  end;

  TLineArray = array of TLine;

var
  Operations: TOperationArray;
  Coordinates: TCoordinateArray;
  Tree: TLineArray;
  Count: Integer;

function Evaluate(const Line: TLine; X: Int64): Int64;
begin
  Result := Line.M * X + Line.B;
end;

procedure SortRange(var Values: TCoordinateArray; Low, High: Integer);
var
  I, J: Integer;
  Pivot, Temporary: Int64;
begin
  if Low >= High then
    Exit;

  Pivot := Values[(Low + High) div 2];
  I := Low;
  J := High;
  while I <= J do
  begin
    while Values[I] < Pivot do
      Inc(I);
    while Values[J] > Pivot do
      Dec(J);
    if I <= J then
    begin
      Temporary := Values[I];
      Values[I] := Values[J];
      Values[J] := Temporary;
      Inc(I);
      Dec(J);
    end;
  end;

  SortRange(Values, Low, J);
  SortRange(Values, I, High);
end;

procedure AddLine(Incoming: TLine; Node, Low, High: Integer);
var
  Middle: Integer;
  BetterLeft, BetterMiddle: Boolean;
  Displaced: TLine;
begin
  while True do
  begin
    if not Tree[Node].Used then
    begin
      Tree[Node] := Incoming;
      Tree[Node].Used := True;
      Exit;
    end;

    Middle := Low + (High - Low) div 2;
    BetterLeft := Evaluate(Incoming, Coordinates[Low]) <
      Evaluate(Tree[Node], Coordinates[Low]);
    BetterMiddle := Evaluate(Incoming, Coordinates[Middle]) <
      Evaluate(Tree[Node], Coordinates[Middle]);

    if BetterMiddle then
    begin
      Displaced := Tree[Node];
      Tree[Node] := Incoming;
      Tree[Node].Used := True;
      Incoming := Displaced;
    end;

    if Low = High then
      Exit;

    if BetterLeft <> BetterMiddle then
    begin
      Node := Node * 2;
      High := Middle;
    end
    else
    begin
      Node := Node * 2 + 1;
      Low := Middle + 1;
    end;
  end;
end;

function RankOf(X: Int64): Integer;
var
  Low, High, Middle: Integer;
begin
  Low := 0;
  High := Count - 1;
  while Low < High do
  begin
    Middle := Low + (High - Low) div 2;
    if Coordinates[Middle] < X then
      Low := Middle + 1
    else
      High := Middle;
  end;
  Result := Low;
end;

function Query(Index: Integer): Int64;
var
  Node, Low, High, Middle: Integer;
  Best: Int64;
  Found: Boolean;
begin
  Node := 1;
  Low := 0;
  High := Count - 1;
  Best := 0;
  Found := False;

  while True do
  begin
    if Tree[Node].Used then
    begin
      if (not Found) or (Evaluate(Tree[Node], Coordinates[Index]) < Best) then
        Best := Evaluate(Tree[Node], Coordinates[Index]);
      Found := True;
    end;

    if Low = High then
      Break;

    Middle := Low + (High - Low) div 2;
    if Index <= Middle then
    begin
      Node := Node * 2;
      High := Middle;
    end
    else
    begin
      Node := Node * 2 + 1;
      Low := Middle + 1;
    end;
  end;

  Result := Best;
end;

var
  Q, I: Integer;
  Kind: Integer;
  K: Integer;
  Next: Integer;
  Incoming: TLine;

begin
  Read(Q);
  if Q <= 0 then
    Exit;

  SetLength(Operations, Q);
  SetLength(Coordinates, Q);
  K := 0;

  for I := 0 to Q - 1 do
  begin
    Read(Kind);
    Operations[I].Kind := Kind;
    Operations[I].M := 0;
    Operations[I].B := 0;
    Operations[I].X := 0;
    if Kind = 1 then
    begin
      Read(Operations[I].M);
      Read(Operations[I].B);
    end
    else
    begin
      Read(Operations[I].X);
      Coordinates[K] := Operations[I].X;
      Inc(K);
    end;
  end;

  if K = 0 then
    Exit;

  SortRange(Coordinates, 0, K - 1);

  Next := 0;
  for I := 0 to K - 1 do
  begin
    if (Next = 0) or (Coordinates[I] <> Coordinates[Next - 1]) then
    begin
      Coordinates[Next] := Coordinates[I];
      Inc(Next);
    end;
  end;
  K := Next;
  SetLength(Coordinates, K);
  Count := K;

  SetLength(Tree, 4 * K);
  for I := 0 to High(Tree) do
  begin
    Tree[I].M := 0;
    Tree[I].B := 0;
    Tree[I].Used := False;
  end;

  for I := 0 to Q - 1 do
  begin
    if Operations[I].Kind = 1 then
    begin
      Incoming.M := Operations[I].M;
      Incoming.B := Operations[I].B;
      Incoming.Used := False;
      AddLine(Incoming, 1, 0, K - 1);
    end
    else
    begin
      WriteLn(IntToStr(Query(RankOf(Operations[I].X))));
    end;
  end;
end.
