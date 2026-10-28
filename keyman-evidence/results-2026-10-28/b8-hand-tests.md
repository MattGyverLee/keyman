# B.8 hand tests: verifying the two version-guarded workarounds on Delphi 12

Context: at `fix2/16043` c003aaf233 (merge tree `test2/16462-on-delphi-stack` c79a12e1d5), FixedTrackbar.pas
and Keyman.System.HttpServer.Base.pas now emit on VER320/VER330 exactly what upstream emits,
and on every other compiler they **warn** instead of failing the build. A Delphi 12 build
proves only that the code compiles. These two tests check the *behaviour* each workaround
exists for. If both PASS on the fixed arm, add VER360 to the verified arm of each guard
(so 12 builds silently) and record the result here.

Record PASS / FAIL / BLOCKED (reason) / UNVERIFIED, with SHA, date and machine.

## B.8-T1: Character Map bottom-row click (FixedTrackbar.pas, TTntFixedDrawGrid)

Used by `common/windows/delphi/charmap/UfrmCharacterMapNew` in keyman.exe and TIKE.

1. Open the Character Map (Keyman tray menu → Character Map; in TIKE, View → Character Map).
2. Resize or scroll so the **bottom row is only partly visible**.
3. Click a cell in that partial row. **Expect:** the cell is selected and the grid does **not**
   scroll or jump to bring it into view.
4. Click the same kind of cell and **hold the mouse button down** for about 2 seconds. **Expect:** no
   timer-driven scrolling while it is held.
5. Do it in both keyman.exe and TIKE.

Result keyman.exe: UNVERIFIED  Result TIKE: UNVERIFIED

## B.8-T2: non-ASCII URL through the local HTTP server (HttpServer.Base.pas)

The workaround re-decodes the URL path as UTF-8, because Indy decodes it wrongly.
Used by kmshell (Keyman Configuration) and TIKE.

1. TIKE: create or copy a keyboard project into a folder with non-ASCII characters in its
   path, e.g. `C:\Temp\b8-ŋgɔ̀m-тест\` (Latin with tone marks, plus Cyrillic). Open it.
   **Expect:** the Project view (HTML) renders, file lists and icons load, and opening a file
   from the Project page works.
2. In that project, add a file whose **file name** has non-ASCII characters (e.g. `ŋkɔ̀.kmn`),
   and open it from the Project page. **Expect:** it opens; no 404 page and no garbled name.
3. kmshell: install a package whose welcome/readme file or path has non-ASCII characters
   (if available), then open Keyman Configuration → keyboard → Help/Welcome. **Expect:** the
   page loads. If no such package exists, record this step as BLOCKED (no test package).

Result TIKE: UNVERIFIED  Result kmshell: UNVERIFIED
