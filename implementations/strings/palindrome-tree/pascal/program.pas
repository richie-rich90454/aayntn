{ Educational reference implementation: Pascal is not a USACO submission language. }
program PalindromeTreeProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

type
  TIntArray = array of Integer;
  TInt64Array = array of Int64;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

var
  Text: string;
  N: Integer;
  Size: Integer;
  I: Integer;
  Cur: Integer;
  At: Integer;
  Code: Integer;
  Child: Integer;
  Edge: Integer;
  Temp: Integer;
  Found: Integer;
  Nodes: Integer;
  Last: Integer;
  Edges: Integer;
  Len: TIntArray;
  Link: TIntArray;
  Head: TIntArray;
  ToNode: TIntArray;
  NextEdge: TIntArray;
  LabelCode: TIntArray;
  Occ: TInt64Array;
  Total: Int64;
begin
  { The input is exactly the contract: one line holding the string. }
  ReadLn(Text);
  StripCR(Text);

  N := Length(Text);
  Size := N + 2;
  SetLength(Len, Size);
  SetLength(Link, Size);
  SetLength(Head, Size);
  SetLength(ToNode, Size);
  SetLength(NextEdge, Size);
  SetLength(LabelCode, Size);
  SetLength(Occ, Size);

  for I := 0 to Size - 1 do
  begin
    Len[I] := 0;
    Link[I] := 0;
    Head[I] := -1;
    ToNode[I] := 0;
    NextEdge[I] := 0;
    LabelCode[I] := 0;
    Occ[I] := 0;
  end;

  Len[0] := -1;
  Link[0] := 0;
  Link[1] := 0;

  Nodes := 2;
  Last := 1;
  Edges := 0;

  for I := 0 to N - 1 do
  begin
    Cur := Last;
    while True do
    begin
      At := I - 1 - Len[Cur];
      if (At >= 0) and (Text[At + 1] = Text[I + 1]) then
        Break;
      Cur := Link[Cur];
    end;

    Code := Ord(Text[I + 1]);
    Child := -1;
    Edge := Head[Cur];
    while Edge <> -1 do
    begin
      if LabelCode[Edge] = Code then
      begin
        Child := ToNode[Edge];
        Break;
      end;
      Edge := NextEdge[Edge];
    end;

    if Child = -1 then
    begin
      Child := Nodes;
      Inc(Nodes);
      Len[Child] := Len[Cur] + 2;
      Head[Child] := -1;
      LabelCode[Edges] := Code;
      ToNode[Edges] := Child;
      NextEdge[Edges] := Head[Cur];
      Head[Cur] := Edges;
      Inc(Edges);

      if Len[Child] = 1 then
        Link[Child] := 1
      else
      begin
        Temp := Link[Cur];
        while True do
        begin
          At := I - 1 - Len[Temp];
          if (At >= 0) and (Text[At + 1] = Text[I + 1]) then
            Break;
          Temp := Link[Temp];
        end;

        Found := -1;
        Edge := Head[Temp];
        while Edge <> -1 do
        begin
          if LabelCode[Edge] = Code then
          begin
            Found := ToNode[Edge];
            Break;
          end;
          Edge := NextEdge[Edge];
        end;
        Link[Child] := Found;
      end;
    end;

    Last := Child;
    Inc(Occ[Last]);
  end;

  for I := Nodes - 1 downto 2 do
    Occ[Link[I]] := Occ[Link[I]] + Occ[I];

  Total := 0;
  for I := 2 to Nodes - 1 do
    Total := Total + Occ[I];

  WriteLn(IntToStr(Nodes - 2));
  WriteLn(IntToStr(Total));
end.
