program BinarySearchMinimal;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

{ Binary search over a sorted array.

  Contract: A[0 .. High(A)] is sorted in non-decreasing order and the search
  interval is inclusive on both ends, so an empty array is the only base
  case. Returns the 0-based index of an element equal to Target, or -1 when
  the target is absent.

  The caller owns the array; the routine allocates nothing. }
function BinarySearch(const A: array of Int64; Target: Int64): Integer;
var
  Lo, Hi, Mid: Integer;
begin
  Lo := 0;
  Hi := High(A);
  Result := -1;
  while Lo <= Hi do
  begin
    { Lo + (Hi - Lo) div 2 cannot overflow the way (Lo + Hi) div 2 can. }
    Mid := Lo + (Hi - Lo) div 2;
    if A[Mid] = Target then
    begin
      Result := Mid;
      Break;
    end;
    if A[Mid] < Target then
      Lo := Mid + 1
    else
      Hi := Mid - 1;
  end;
end;

var
  Sample: array[0..3] of Int64 = (1, 3, 5, 7);
begin
  { Self-check only: the routine above is the reusable part, so this file
    asserts the documented contract instead of reading input. }
  if BinarySearch(Sample, 5) <> 2 then
    Halt(1);
  if BinarySearch(Sample, 6) <> -1 then
    Halt(1);
end.
