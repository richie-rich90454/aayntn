{ Educational reference implementation: Pascal is not a USACO submission language. }
program GrayCodes;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, I, Bit, GrayCode: Integer;

begin
  Read(N);
  if (N >= 1) and (N <= 20) then
  begin
    for I := 0 to (1 shl N) - 1 do
    begin
      GrayCode := I xor (I shr 1);
      for Bit := N - 1 downto 0 do
        Write(IntToStr((GrayCode shr Bit) and 1));
      WriteLn;
    end;
  end;
end.
