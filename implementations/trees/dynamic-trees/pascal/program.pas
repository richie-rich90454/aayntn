{ Educational reference implementation: Pascal is not a USACO submission language. }
program DynamicTreesProgram;
{$mode objfpc}{$H+}

uses SysUtils;

{ A link-cut forest on the vertices 1..N. Index 0 is the null node. }
var
  N, Q: Integer;
  ChildLeft, ChildRight, Parent, Reversed, Stack: array of Integer;
  Value, Sum: array of Int64;

function IsAuxRoot(X: Integer): Boolean;
var
  P: Integer;
begin
  P := Parent[X];
  Result := (P = 0) or ((ChildLeft[P] <> X) and (ChildRight[P] <> X));
end;

procedure Pull(X: Integer);
begin
  Sum[X] := Sum[ChildLeft[X]] + Sum[ChildRight[X]] + Value[X];
end;

procedure ApplyReverse(X: Integer);
var
  Swap: Integer;
begin
  if X = 0 then
    Exit;
  Swap := ChildLeft[X];
  ChildLeft[X] := ChildRight[X];
  ChildRight[X] := Swap;
  Reversed[X] := Reversed[X] xor 1;
end;

procedure Push(X: Integer);
begin
  if Reversed[X] = 0 then
    Exit;
  ApplyReverse(ChildLeft[X]);
  ApplyReverse(ChildRight[X]);
  Reversed[X] := 0;
end;

{ Pushes every lazy reversal on the aux-tree path from the root down to X. }
procedure PushPath(X: Integer);
var
  Top: Integer;
  Y: Integer;
begin
  Top := 0;
  Y := X;
  Stack[Top] := Y;
  Inc(Top);
  while not IsAuxRoot(Y) do
  begin
    Y := Parent[Y];
    Stack[Top] := Y;
    Inc(Top);
  end;
  while Top > 0 do
  begin
    Dec(Top);
    Push(Stack[Top]);
  end;
end;

procedure Rotate(X: Integer);
var
  Y, Z, Middle: Integer;
  XIsRight: Boolean;
begin
  Y := Parent[X];
  Z := Parent[Y];
  XIsRight := ChildRight[Y] = X;
  if XIsRight then
    Middle := ChildLeft[X]
  else
    Middle := ChildRight[X];

  if not IsAuxRoot(Y) then
  begin
    if ChildLeft[Z] = Y then
      ChildLeft[Z] := X
    else
      ChildRight[Z] := X;
  end;
  Parent[X] := Z;

  if XIsRight then
  begin
    ChildLeft[X] := Y;
    ChildRight[Y] := Middle;
  end
  else
  begin
    ChildRight[X] := Y;
    ChildLeft[Y] := Middle;
  end;
  if Middle <> 0 then
    Parent[Middle] := Y;
  Parent[Y] := X;
  Pull(Y);
  Pull(X);
end;

procedure Splay(X: Integer);
var
  Y, Z: Integer;
  XIsLeft, YIsLeft: Boolean;
begin
  PushPath(X);
  while not IsAuxRoot(X) do
  begin
    Y := Parent[X];
    Z := Parent[Y];
    if not IsAuxRoot(Y) then
    begin
      XIsLeft := ChildLeft[Y] = X;
      YIsLeft := ChildLeft[Z] = Y;
      if XIsLeft = YIsLeft then
        Rotate(Y)
      else
        Rotate(X);
    end;
    Rotate(X);
  end;
end;

procedure Expose(X: Integer);
var
  Last, Y: Integer;
begin
  Last := 0;
  Y := X;
  while Y <> 0 do
  begin
    Splay(Y);
    ChildRight[Y] := Last;
    Pull(Y);
    Last := Y;
    Y := Parent[Y];
  end;
  Splay(X);
end;

procedure MakeRoot(X: Integer);
begin
  Expose(X);
  ApplyReverse(X);
end;

function FindRoot(X: Integer): Integer;
begin
  Expose(X);
  while True do
  begin
    Push(X);
    if ChildLeft[X] = 0 then
      Break;
    X := ChildLeft[X];
  end;
  Splay(X);
  Result := X;
end;

procedure Link(X, Y: Integer);
begin
  MakeRoot(X);
  if FindRoot(Y) <> X then
    Parent[X] := Y;
end;

procedure Cut(X, Y: Integer);
begin
  MakeRoot(X);
  Expose(Y);
  if (ChildLeft[Y] = X) and (ChildRight[X] = 0) then
  begin
    ChildLeft[Y] := 0;
    Parent[X] := 0;
    Pull(Y);
  end;
end;

function PathSum(X, Y: Integer): Int64;
begin
  MakeRoot(X);
  Expose(Y);
  Result := Sum[Y];
end;

{ Removes the carriage return that a CRLF line leaves at the end. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

function NextInt(const S: string; var Pos: Integer): Int64;
var
  Sign: Integer;
  Digit: Integer;
begin
  while (Pos <= Length(S)) and (S[Pos] <= ' ') do
    Inc(Pos);
  Sign := 1;
  if (Pos <= Length(S)) and (S[Pos] = '-') then
  begin
    Sign := -1;
    Inc(Pos);
  end;
  Result := 0;
  while Pos <= Length(S) do
  begin
    if (S[Pos] < '0') or (S[Pos] > '9') then
      Break;
    Digit := Ord(S[Pos]) - Ord('0');
    Result := Result * 10 + Digit;
    Inc(Pos);
  end;
  Result := Result * Sign;
end;

procedure ParseOperation(const S: string; var Op: Char; var U, V: Int64);
var
  Pos: Integer;
begin
  Pos := 1;
  while (Pos <= Length(S)) and (S[Pos] <= ' ') do
    Inc(Pos);
  if Pos > Length(S) then
  begin
    Op := #0;
    U := 0;
    V := 0;
    Exit;
  end;
  Op := S[Pos];
  while (Pos <= Length(S)) and (S[Pos] > ' ') do
    Inc(Pos);
  U := NextInt(S, Pos);
  V := NextInt(S, Pos);
end;

var
  Line: string;
  Pos: Integer;
  Op: Char;
  U, V: Int64;
  I: Integer;

begin
  ReadLn(Line);
  StripCR(Line);
  Pos := 1;
  N := Integer(NextInt(Line, Pos));
  Q := Integer(NextInt(Line, Pos));
  if (N <= 0) or (Q < 0) then
    Exit;

  SetLength(ChildLeft, N + 1);
  SetLength(ChildRight, N + 1);
  SetLength(Parent, N + 1);
  SetLength(Reversed, N + 1);
  SetLength(Stack, N + 1);
  SetLength(Value, N + 1);
  SetLength(Sum, N + 1);
  for I := 1 to N do
  begin
    Value[I] := I;
    Sum[I] := I;
  end;

  for I := 1 to Q do
  begin
    ReadLn(Line);
    StripCR(Line);
    ParseOperation(Line, Op, U, V);
    if Op = 'l' then
      Link(Integer(U) + 1, Integer(V) + 1)
    else if Op = 'c' then
      Cut(Integer(U) + 1, Integer(V) + 1)
    else if Op = 'p' then
      WriteLn(PathSum(Integer(U) + 1, Integer(V) + 1));
  end;
end.
