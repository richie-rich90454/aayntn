program ProfileDP;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TTokens = array of string;

{ Reads the whole standard input, one line at a time, so that the tokens can
  be split without depending on where the line breaks fall. }
function ReadAllInput: string;
var
  Row: string;
begin
  Result := '';
  ReadLn(Row);
  while Row <> '' do
  begin
    Result := Result + Row + ' ';
    ReadLn(Row);
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

var
  Tokens: TTokens;
  Grid: TTokens;
  R: Integer;
  C: Integer;
  I: Integer;
  J: Integer;
  K: Integer;
  Mask: Integer;
  Base: Integer;
  Size: Integer;
  Ways: Int64;
  Dp: array of Int64;
  Next: array of Int64;

begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Exit;

  R := StrToIntDef(Tokens[0], 0);
  C := StrToIntDef(Tokens[1], 0);
  if (R <= 0) or (C <= 0) then
  begin
    WriteLn('1');
    Exit;
  end;

  SetLength(Grid, R);
  for I := 0 to R - 1 do
  begin
    if 2 + I < Length(Tokens) then
      Grid[I] := Tokens[2 + I]
    else
      Grid[I] := '';
  end;

  Size := 1 shl C;
  SetLength(Dp, Size);
  SetLength(Next, Size);
  Dp[0] := 1;

  for I := 0 to R - 1 do
  begin
    for J := 0 to C - 1 do
    begin
      K := I * C + J;
      for Mask := 0 to Size - 1 do
        Next[Mask] := 0;

      for Mask := 0 to Size - 1 do
      begin
        Ways := Dp[Mask];
        if Ways = 0 then
          Continue;
        Base := Mask shr 1;

        if Grid[I][J + 1] = '1' then
        begin
          if (Mask and 1) = 0 then
            Inc(Next[Base], Ways);
        end
        else if (Mask and 1) <> 0 then
          Inc(Next[Base], Ways)
        else
        begin
          if (J + 1 < C) and (Grid[I][J + 2] = '0') and ((Mask and 2) = 0) then
            Inc(Next[Base or 1], Ways);
          if (I + 1 < R) and (Grid[I + 1][J + 1] = '0') then
            Inc(Next[Base or (1 shl (C - 1))], Ways);
        end;
      end;

      for Mask := 0 to Size - 1 do
        Dp[Mask] := Next[Mask];
    end;
  end;

  WriteLn(IntToStr(Dp[0]));
end.
