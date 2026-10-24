{ Educational reference implementation: Pascal is not a USACO submission language. }
program FftProduct;
{$mode objfpc}{$H+}

uses SysUtils;

const
  TwoPi = 6.283185307179586476925286766559;

type
  TRealArray = array of Double;

{ The iterative radix-2 Cooley-Tukey transform, in place. A positive angle
  is the forward transform and a negative angle is the inverse, which is
  then divided by N. }
procedure Fft(var Re, Im: TRealArray; N: Integer; Invert: Boolean);
var
  I, J, Bit, Len, Half, Start, K: Integer;
  Angle, WLenRe, WLenIm, WRe, WIm, NextRe: Double;
  URe, UIm, VRe, VIm, Tmp: Double;
begin
  J := 0;
  for I := 1 to N - 1 do
  begin
    Bit := N div 2;
    while (J and Bit) <> 0 do
    begin
      J := J xor Bit;
      Bit := Bit div 2;
    end;
    J := J xor Bit;
    if I < J then
    begin
      Tmp := Re[I];
      Re[I] := Re[J];
      Re[J] := Tmp;
      Tmp := Im[I];
      Im[I] := Im[J];
      Im[J] := Tmp;
    end;
  end;

  Len := 2;
  while Len <= N do
  begin
    if Invert then
      Angle := -TwoPi / Len
    else
      Angle := TwoPi / Len;
    WLenRe := Cos(Angle);
    WLenIm := Sin(Angle);
    Half := Len div 2;
    Start := 0;
    while Start < N do
    begin
      WRe := 1.0;
      WIm := 0.0;
      for K := 0 to Half - 1 do
      begin
        URe := Re[Start + K];
        UIm := Im[Start + K];
        VRe := Re[Start + K + Half] * WRe - Im[Start + K + Half] * WIm;
        VIm := Re[Start + K + Half] * WIm + Im[Start + K + Half] * WRe;
        Re[Start + K] := URe + VRe;
        Im[Start + K] := UIm + VIm;
        Re[Start + K + Half] := URe - VRe;
        Im[Start + K + Half] := UIm - VIm;
        NextRe := WRe * WLenRe - WIm * WLenIm;
        WIm := WRe * WLenIm + WIm * WLenRe;
        WRe := NextRe;
      end;
      Start := Start + Len;
    end;
    Len := Len * 2;
  end;

  if Invert then
    for I := 0 to N - 1 do
    begin
      Re[I] := Re[I] / N;
      Im[I] := Im[I] / N;
    end;
end;

{ Round to nearest, with exact halves going away from zero. }
function RoundHalfAway(X: Double): Int64;
begin
  if X >= 0 then
    Result := Trunc(X + 0.5)
  else
    Result := Trunc(X - 0.5);
end;

var
  N, M, I, Size, Total, Value: Integer;
  ARe, AIm, BRe, BIm: TRealArray;
  RePart, ImPart: Double;
begin
  Read(N);
  SetLength(ARe, N);
  SetLength(AIm, N);
  for I := 0 to N - 1 do
  begin
    Read(Value);
    ARe[I] := Value;
    AIm[I] := 0.0;
  end;

  Read(M);
  SetLength(BRe, M);
  SetLength(BIm, M);
  for I := 0 to M - 1 do
  begin
    Read(Value);
    BRe[I] := Value;
    BIm[I] := 0.0;
  end;

  Total := N + M - 1;
  Size := 1;
  while Size < Total do
    Size := Size * 2;

  SetLength(ARe, Size);
  SetLength(AIm, Size);
  SetLength(BRe, Size);
  SetLength(BIm, Size);
  for I := N to Size - 1 do
  begin
    ARe[I] := 0.0;
    AIm[I] := 0.0;
  end;
  for I := M to Size - 1 do
  begin
    BRe[I] := 0.0;
    BIm[I] := 0.0;
  end;

  Fft(ARe, AIm, Size, False);
  Fft(BRe, BIm, Size, False);
  for I := 0 to Size - 1 do
  begin
    RePart := ARe[I] * BRe[I] - AIm[I] * BIm[I];
    ImPart := ARe[I] * BIm[I] + AIm[I] * BRe[I];
    ARe[I] := RePart;
    AIm[I] := ImPart;
  end;
  Fft(ARe, AIm, Size, True);

  for I := 0 to Total - 1 do
  begin
    if I > 0 then
      Write(' ');
    Write(IntToStr(RoundHalfAway(ARe[I])));
  end;
  WriteLn;
end.
