{ Educational reference implementation: Pascal is not a USACO submission language. }
program MinimalRotationProgram;
{$mode objfpc}{$H+}

uses SysUtils;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

function LeastRotation(const S: string): Integer;
var
  N: Integer;
  I: Integer;
  J: Integer;
  K: Integer;
  A: Char;
  B: Char;
begin
  N := Length(S);
  I := 0;
  J := 1;
  K := 0;
  while (I < N) and (J < N) and (K < N) do
  begin
    A := S[((I + K) mod N) + 1];
    B := S[((J + K) mod N) + 1];
    if A = B then
      Inc(K)
    else if A > B then
    begin
      I := I + K + 1;
      if I <= J then
        I := J + 1;
      K := 0;
    end
    else
    begin
      J := J + K + 1;
      if J <= I then
        J := I + 1;
      K := 0;
    end;
  end;
  if I < J then
    Result := I
  else
    Result := J;
end;

var
  S: string;
  Start: Integer;
  N: Integer;
begin
  ReadLn(S);
  StripCR(S);
  N := Length(S);
  if N = 0 then
  begin
    WriteLn('');
    Exit;
  end;
  Start := LeastRotation(S);
  Write(Copy(S, Start + 1, N - Start));
  WriteLn(Copy(S, 1, Start));
end.
