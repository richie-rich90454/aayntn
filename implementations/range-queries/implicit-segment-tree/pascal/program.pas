// Educational reference implementation: Pascal is not a USACO submission language.
program ImplicitSegmentTree;
{$mode objfpc}{$H+}

var
  m, q: Integer;
  left, right: array of Integer;
  total: array of int64;
  used: Integer;
  bits, capacity, k, kind, pos, l, r: Integer;
  delta: int64;

{ Node 0 is the null node: it has no interval and its sum is always zero. }
function NewNode: Integer;
begin
  Result := used;
  Inc(used);
  left[Result] := 0;
  right[Result] := 0;
  total[Result] := 0;
end;

procedure Add(node, lo, hi, at: Integer; change: int64);
var
  mid: Integer;
begin
  total[node] := total[node] + change;
  if lo = hi then
    Exit;
  mid := lo + (hi - lo) div 2;
  if at <= mid then
  begin
    if left[node] = 0 then
      left[node] := NewNode;
    Add(left[node], lo, mid, at, change);
  end
  else
  begin
    if right[node] = 0 then
      right[node] := NewNode;
    Add(right[node], mid + 1, hi, at, change);
  end;
end;

function Query(node, lo, hi, ql, qr: Integer): int64;
var
  mid: Integer;
  answer: int64;
begin
  if (node = 0) or (qr < lo) or (hi < ql) then
    Exit(0);
  if (ql <= lo) and (hi <= qr) then
    Exit(total[node]);
  mid := lo + (hi - lo) div 2;
  answer := 0;
  if ql <= mid then
    answer := answer + Query(left[node], lo, mid, ql, qr);
  if qr > mid then
    answer := answer + Query(right[node], mid + 1, hi, ql, qr);
  Query := answer;
end;

function CeilLog2(value: Integer): Integer;
var
  size: int64;
  count: Integer;
begin
  size := 1;
  count := 0;
  while size < value do
  begin
    size := size * 2;
    Inc(count);
  end;
  CeilLog2 := count;
end;

begin
  m := 0;
  Read(m);
  q := 0;
  Read(q);
  if (m < 1) or (q < 0) then
    Halt(0);

  bits := CeilLog2(m);
  capacity := 2 + q * (bits + 1);
  SetLength(left, capacity);
  SetLength(right, capacity);
  SetLength(total, capacity);
  used := 1;
  NewNode;

  for k := 1 to q do
  begin
    Read(kind);
    if kind = 1 then
    begin
      pos := 0;
      Read(pos);
      delta := 0;
      Read(delta);
      Add(1, 1, m, pos, delta);
    end
    else if kind = 2 then
    begin
      l := 0;
      Read(l);
      r := 0;
      Read(r);
      WriteLn(Query(1, 1, m, l, r));
    end
    else
      Break;
  end;
end.
