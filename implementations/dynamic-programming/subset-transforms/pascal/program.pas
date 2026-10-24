{ Educational reference implementation: Pascal is not a USACO submission language. }
program SubsetTransforms;
{$mode objfpc}{$H+}

uses SysUtils;

const
  MODULO = 1000000007;

var
  N, Total, Mask, Bit, Step, Base, Off, Sum: LongInt;
  G: array of LongInt;

begin
  Read(N);
  if (N < 0) or (N > 24) then
    Exit;

  Total := 1 shl N;
  SetLength(G, Total);
  for Mask := 0 to Total - 1 do
  begin
    G[Mask] := 0;
    Read(G[Mask]);
  end;

  Step := 1;
  for Bit := 0 to N - 1 do
  begin
    Base := 0;
    while Base < Total do
    begin
      for Off := 0 to Step - 1 do
      begin
        Sum := G[Base + Step + Off] + G[Base + Off];
        if Sum >= MODULO then
          Sum := Sum - MODULO;
        G[Base + Step + Off] := Sum;
      end;
      Base := Base + Step * 2;
    end;
    Step := Step * 2;
  end;

  for Mask := 0 to Total - 1 do
  begin
    if Mask > 0 then
      Write(' ');
    Write(IntToStr(G[Mask]));
  end;
  WriteLn;
end.
