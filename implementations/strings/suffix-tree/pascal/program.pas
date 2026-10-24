{ Educational reference implementation: Pascal is not a USACO submission language. }
program SuffixTreeProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TIntArray = array of Integer;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

{ Maps a lowercase letter to 0..25 and the sentinel to 26. }
function CharCode(Ch: Char): Integer;
begin
  if Ch = '$' then
    CharCode := 26
  else
    CharCode := Ord(Ch) - Ord('a');
end;

var
  S: string;
  T: string;
  N2: Integer;
  Cap: Integer;
  I: Integer;
  V: Integer;
  P: Integer;
  C: Integer;
  U: Integer;
  L: Integer;
  MaxL: Integer;
  W: Integer;
  Leaf: Integer;
  Code: Integer;
  NodeCount: Integer;
  Sum: Int64;
  Best: Integer;
  Child: TIntArray;
  EdgeStart: TIntArray;
  EdgeLen: TIntArray;
  Depth: TIntArray;
  ChildCount: TIntArray;
begin
  { The input is exactly the contract: one line holding the string. }
  ReadLn(S);
  StripCR(S);
  T := S + '$';
  N2 := Length(T);

  Cap := 2 * N2 + 2;
  SetLength(Child, Cap * 27);
  for I := 0 to High(Child) do
    Child[I] := -1;
  SetLength(EdgeStart, Cap);
  SetLength(EdgeLen, Cap);
  SetLength(Depth, Cap);
  SetLength(ChildCount, Cap);
  NodeCount := 1;

  { Insert every suffix of T, splitting an edge when it diverges. }
  for I := 1 to N2 do
  begin
    V := 0;
    P := I;
    while True do
    begin
      C := CharCode(T[P]);
      U := Child[V * 27 + C];
      if U = -1 then
      begin
        U := NodeCount;
        Inc(NodeCount);
        EdgeStart[U] := P;
        EdgeLen[U] := N2 - P + 1;
        Depth[U] := Depth[V] + EdgeLen[U];
        Child[V * 27 + C] := U;
        Inc(ChildCount[V]);
        Break;
      end;

      MaxL := EdgeLen[U];
      if N2 - P + 1 < MaxL then
        MaxL := N2 - P + 1;
      L := 0;
      while (L < MaxL) and (T[EdgeStart[U] + L] = T[P + L]) do
        Inc(L);

      if L = EdgeLen[U] then
      begin
        V := U;
        P := P + L;
        if P > N2 then
          Break;
      end
      else
      begin
        W := NodeCount;
        Inc(NodeCount);
        Child[V * 27 + C] := W;
        EdgeStart[W] := EdgeStart[U];
        EdgeLen[W] := L;
        Depth[W] := Depth[V] + L;

        Code := CharCode(T[EdgeStart[U] + L]);
        Child[W * 27 + Code] := U;
        Inc(ChildCount[W]);
        EdgeStart[U] := EdgeStart[U] + L;
        EdgeLen[U] := EdgeLen[U] - L;

        Leaf := NodeCount;
        Inc(NodeCount);
        EdgeStart[Leaf] := P + L;
        EdgeLen[Leaf] := N2 - (P + L) + 1;
        Depth[Leaf] := Depth[W] + EdgeLen[Leaf];
        Code := CharCode(T[P + L]);
        Child[W * 27 + Code] := Leaf;
        Inc(ChildCount[W]);
        Break;
      end;
    end;
  end;

  { Sum the edge lengths and find the deepest node with two children. }
  Sum := 0;
  Best := 0;
  for V := 1 to NodeCount - 1 do
  begin
    Sum := Sum + EdgeLen[V];
    if (ChildCount[V] >= 2) and (Depth[V] > Best) then
      Best := Depth[V];
  end;

  WriteLn(IntToStr(Sum - N2));
  WriteLn(IntToStr(Best));
end.
