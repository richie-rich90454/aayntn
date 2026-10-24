{ Educational reference implementation: Pascal is not a USACO submission language. }
program PersistentStack;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

var
  Q, I, Kind, V, X: LongInt;
  Line, Rest: string;
  Value, Parent, Root: array of LongInt;
  Nodes, Versions, Old: LongInt;

function TakeInt(var S: string): LongInt;
var
  P, Sign, Number: LongInt;
begin
  S := Trim(S);
  P := 1;
  Sign := 1;
  if (P <= Length(S)) and (S[P] = '-') then
  begin
    Sign := -1;
    Inc(P);
  end;
  Number := 0;
  while (P <= Length(S)) and (S[P] >= '0') and (S[P] <= '9') do
  begin
    Number := Number * 10 + (Ord(S[P]) - Ord('0'));
    Inc(P);
  end;
  S := Trim(Copy(S, P, Length(S)));
  TakeInt := Sign * Number;
end;

begin
  Read(Q);
  ReadLn(Line);

  SetLength(Value, Q + 1);
  SetLength(Parent, Q + 1);
  SetLength(Root, Q + 1);

  Root[0] := -1;
  Nodes := 0;
  Versions := 0;

  for I := 1 to Q do
  begin
    ReadLn(Line);
    Kind := Ord(Line[1]) - Ord('0');
    Rest := Copy(Line, 2, Length(Line));
    V := TakeInt(Rest);

    if Kind = 1 then
    begin
      X := TakeInt(Rest);
      Value[Nodes] := X;
      Parent[Nodes] := Root[V];
      Inc(Versions);
      Root[Versions] := Nodes;
      Inc(Nodes);
    end
    else if Kind = 2 then
    begin
      Old := Root[V];
      Inc(Versions);
      if Old = -1 then
        Root[Versions] := -1
      else
        Root[Versions] := Parent[Old];
    end
    else
    begin
      Old := Root[V];
      if Old = -1 then
        WriteLn(-1)
      else
        WriteLn(Value[Old]);
    end;
  end;
end.
