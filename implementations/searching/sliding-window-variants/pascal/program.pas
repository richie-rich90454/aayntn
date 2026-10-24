{ Educational reference implementation: Pascal is not a USACO submission language. }
program SlidingWindowVariantsProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

var
  S: string;
  K, Left, Right, Best, Distinct, Code: LongInt;
  Count: array[0..255] of LongInt;

begin
  S := '';
  ReadLn(S);
  S := Trim(S);
  K := 0;
  Read(K);
  if K < 0 then
    K := 0;

  for Code := 0 to 255 do
    Count[Code] := 0;

  Left := 1;
  Best := 0;
  Distinct := 0;

  for Right := 1 to Length(S) do
  begin
    Code := Ord(S[Right]);
    if Count[Code] = 0 then
      Inc(Distinct);
    Inc(Count[Code]);

    while Distinct > K do
    begin
      Code := Ord(S[Left]);
      Dec(Count[Code]);
      if Count[Code] = 0 then
        Dec(Distinct);
      Inc(Left);
    end;

    if Right - Left + 1 > Best then
      Best := Right - Left + 1;
  end;

  WriteLn(IntToStr(Best));
end.
