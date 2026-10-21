{ aayntn: the general-purpose Free Pascal contest template.

  Pascal is an educational reference only. The published USACO contest
  instructions state that Pascal support has been discontinued, so nothing
  written in this language can be submitted to the competition. This file
  exists so that the same algorithm can be read in a language with a
  different model of memory and input.

  The two mode directives are written explicitly so that the behavior of the
  program does not depend on the compiler's default. The objfpc mode is the
  dialect that Free Pascal extends, and the H directive turns on the
  long-string support that the standard library expects.

  Compile with:  fpc -Mobjfpc -Sh template.pas
}
program TemplateProgram;

{$mode objfpc}{$H+}

uses
    SysUtils;

var
    Reader: Text;
    Writer: Text;

{ Reads the next whitespace-separated integer from the standard input.
  The input is read in one piece and then split, because a Pascal text file
  does not offer a cheap way to read a single token. }
function NextInt(out Value: Int64): Boolean;
var
    Buffer: AnsiString;
    Position: Integer;
    Start: Integer;
    Code: Integer;
begin
    Value := 0;
    if not SeekEof(Reader) then
    begin
        SetLength(Buffer, 1 shl 16);
        BlockRead(Reader, Buffer[1], SizeOf(Buffer[1]));
        Position := 1;
        Start := 1;
        while Position <= Length(Buffer) do
        begin
            Code := Ord(Buffer[Position]);
            if (Code > 32) and (Position = Start) then
            begin
                Start := Position;
            end;
            if Code <= 32 then
            begin
                if Start < Position then
                begin
                    Value := StrToInt64Def(Copy(Buffer, Start, Position - Start), 0);
                    Exit(True);
                end;
            end;
            Inc(Position);
        end;
        if Start < Position then
        begin
            Value := StrToInt64Def(Copy(Buffer, Start, Position - Start), 0);
            Exit(True);
        end;
    end;
    Result := False;
end;

var
    N: Int64;
begin
    AssignFile(Reader, 'CONIN$');
    Reset(Reader);

    AssignFile(Writer, 'CONOUT$');
    Rewrite(Writer);

    { The algorithm goes here. }
    if NextInt(N) then
    begin
        WriteLn(Writer, N);
    end;

    CloseFile(Reader);
    CloseFile(Writer);
end.
