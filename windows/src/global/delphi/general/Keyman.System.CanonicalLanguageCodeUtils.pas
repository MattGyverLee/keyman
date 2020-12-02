unit Keyman.System.CanonicalLanguageCodeUtils;

interface

type
  TCanonicalLanguageCodeUtils = class
    class function FindBestTag(const Tag: string; AddRegion: Boolean): string;
    class function IsCanonical(const Tag: string; AddRegion: Boolean): Boolean; overload;
    class function IsCanonical(const Tag: string; var Msg: string; AddRegion: Boolean): Boolean; overload;
  end;

implementation

uses
  BCP47Tag,
  Keyman.System.LanguageCodeUtils,
  Keyman.System.Standards.LangTagsRegistry,
  System.SysUtils;

///
///<summary>Find a language code with appropriate script and region subtags</summary>
///<remarks>
///  This will canonicalize known tags, then apply rules to ensure script subtag
///  is present if not suppressed, and add a default region if none given.
///</remarks>
class function TCanonicalLanguageCodeUtils.FindBestTag(const Tag: string; AddRegion: Boolean): string;
var
  t: TBCP47Tag;
  LangTag: TLangTag;
begin
  if Tag = '' then
    Exit('');

  t := TBCP47Tag.Create(Tag);
  try
    if t.Tag = '' then
      Exit('');

    // First, canonicalize any unnecessary ISO639-3 codes
    t.Language := TLanguageCodeUtils.TranslateISO6393ToBCP47(t.Language);


    // Lookup the tag first, canonicalize to the base tag for known tags
    if TLangTagsMap.AllTags.TryGetValue(t.Tag, Result) then
    begin
      t.Tag := Result;
    end;

    if not TLangTagsMap.LangTags.TryGetValue(t.Language, LangTag) then
    begin
       // Not a valid language subtag but perhaps it's a custom language
       // We'll make no further assumptions
      Exit(t.Tag);
    end;

    // Then, lookup the lang-script and see if there is a suppress-script
    if SameText(t.Script, LangTag.script) and LangTag.suppress then
      t.Script := ''
    // Or add the default script in if it is missing and not a suppress-script
    else if (t.Script = '') and not LangTag.suppress then
      t.Script := LangTag.script;

    // Add the region if not specified
    // For Windows scenarios, we'll want to add a region. For cross-platform,
    // we probably don't want to.
    if (t.Region = '') and AddRegion then
      t.Region := LangTag.region;

    Exit(t.Tag);
  finally
    t.Free;
  end;
end;

class function TCanonicalLanguageCodeUtils.IsCanonical(const Tag: string; AddRegion: Boolean): Boolean;
begin
  Result := SameText(Tag, FindBestTag(Tag, AddRegion));
end;

class function TCanonicalLanguageCodeUtils.IsCanonical(const Tag: string;
  var Msg: string; AddRegion: Boolean): Boolean;
var
  c: string;
begin
  c := FindBestTag(Tag, AddRegion);
  Result := SameText(c, Tag);
  if not Result then
  begin
    msg := '''' + Tag + ''' is a valid tag but is not canonical: it should be '''+c+'''';
  end;
end;

end.
