{ Educational reference implementation: Pascal is not a USACO submission language. }
program TopTreeProgram;
{$mode objfpc}{$H+}

uses SysUtils;

{ The reference programs use a link-cut tree, not an explicit top tree.
  Preferred paths are the compress clusters and path-parent edges are the
  rakes. Vertices are stored as 1..N and index 0 is the null node. }
var
  N, Q, I: Integer;
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

procedure PushPath(X: Integer);
var
  Top, Y: Integer;
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

procedure AccessPath(X: Integer);
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
  AccessPath(X);
  ApplyReverse(X);
end;

function FindRoot(X: Integer): Integer;
begin
  AccessPath(X);
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
  AccessPath(Y);
  if (ChildLeft[Y] = X) and (ChildRight[X] = 0) then
  begin
    ChildLeft[Y] := 0;
    Parent[X] := 0;
    Pull(Y);
  end;
end;

procedure SetValue(X: Integer; V: Int64);
begin
  AccessPath(X);
  Value[X] := V;
  Pull(X);
end;

function PathSum(X, Y: Integer): Int64;
begin
  if FindRoot(X) <> FindRoot(Y) then
    Exit(0);
  MakeRoot(X);
  AccessPath(Y);
  Result := Sum[Y];
end;

procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

function NextInt(const S: string; var Pos: Integer): Int64;
var
  Sign, Digit: Integer;
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

procedure ParseOperation(const S: string; var Op: Char; var A, B: Int64);
var
  Pos: Integer;
begin
  Pos := 1;
  while (Pos <= Length(S)) and (S[Pos] <= ' ') do
    Inc(Pos);
  if Pos > Length(S) then
  begin
    Op := #0;
    A := 0;
    B := 0;
    Exit;
  end;
  Op := S[Pos];
  while (Pos <= Length(S)) and (S[Pos] > ' ') do
    Inc(Pos);
  A := NextInt(S, Pos);
  B := NextInt(S, Pos);
end;

var
  Line: string;
  Pos: Integer;
  Op: Char;
  A, B: Int64;

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
    Value[I] := 1;
    Sum[I] := 1;
  end;

  for I := 1 to Q do
  begin
    ReadLn(Line);
    StripCR(Line);
    ParseOperation(Line, Op, A, B);
    if Op = 's' then
    begin
      if (A >= 0) and (A < N) then
        SetValue(Integer(A) + 1, B);
    end
    else if (A < 0) or (A >= N) or (B < 0) or (B >= N) then
    begin
      if Op = 'p' then
        WriteLn(0);
    end
    else if Op = 'l' then
      Link(Integer(A) + 1, Integer(B) + 1)
    else if Op = 'c' then
      Cut(Integer(A) + 1, Integer(B) + 1)
    else if Op = 'p' then
      WriteLn(PathSum(Integer(A) + 1, Integer(B) + 1));
  end;
end.
