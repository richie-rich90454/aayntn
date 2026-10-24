{ Educational reference implementation: Pascal is not a USACO submission language. }
program SubsequenceHashingProgram;
{$mode objfpc}{$H+}

uses SysUtils;

const
  BASE = 8000011;
  MODULO = 90000049;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

var
  S: string;
  N: Integer;
  Q: Integer;
  I: Integer;
  J: Integer;
  Query: Integer;
  Value: Int64;
  Prefix: array of Int64;
  Suffix: array of Int64;
  Power: array of Int64;
begin
  ReadLn(S);
  StripCR(S);
  N := Length(S);

  SetLength(Power, N + 1);
  SetLength(Prefix, N + 1);
  SetLength(Suffix, N + 1);

  Power[0] := 1;
  for I := 1 to N do
    Power[I] := (Power[I - 1] * BASE) mod MODULO;

  Prefix[0] := 0;
  for I := 1 to N do
    Prefix[I] := (Prefix[I - 1] * BASE + (Ord(S[I]) - Ord('a') + 1)) mod MODULO;

  Suffix[N] := 0;
  for I := N downto 1 do
  begin
    Value := Ord(S[I]) - Ord('a') + 1;
    Suffix[I - 1] := (Value * Power[N - I] + Suffix[I]) mod MODULO;
  end;

  Read(Q);
  for Query := 1 to Q do
  begin
    Read(I);
    Read(J);
    Value := (Prefix[I] * Power[N - 1 - I] + Suffix[I + 1]) mod MODULO;
    if Value = (Prefix[J] * Power[N - 1 - J] + Suffix[J + 1]) mod MODULO then
      WriteLn('SAME')
    else
      WriteLn('DIFFERENT');
  end;
end.
